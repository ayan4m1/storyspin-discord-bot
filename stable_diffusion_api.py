import torch
import cv2
import RRDBNet_arch as arch
import numpy as np
import BLIP.models.blip
import os

from torchvision import transforms
from torchvision.transforms.functional import InterpolationMode
from diffusers import StableDiffusionPipeline, StableDiffusionImg2ImgPipeline, EulerAncestralDiscreteScheduler
from torch import autocast
from PIL import Image, PngImagePlugin
from flask import Flask, request

app = Flask(__name__)
sd_model_base_path = '../models/'
sd_models = {
    'analog': 'Analog-Diffusion',
    'dreamlike': 'dreamlike-diffusion-1.0',
    'stable-1.4': 'stable-diffusion-v1-4',
    'waifu': 'waifu-diffusion',
    'trinart': 'trinart_diffusers_v2',
    'protogen': 'Protogen_x3.4_Official_Release'
}
# sd_model_path = '../models/stable-diffusion-v1-4'
def sd_model_path(model_key):
    return sd_model_base_path + sd_models[model_key]

esrgan_model_path = './4x_foolhardy_Remacri_out.pth'
blip_model_path = './model_base_caption_capfilt_large.pth'

device = torch.device('cuda')

# create Stable Diffusion pipelines
scheduler = EulerAncestralDiscreteScheduler(
    beta_start=0.00085,
    beta_end=0.012,
    beta_schedule='scaled_linear'
)
text_pipe = StableDiffusionPipeline.from_pretrained(sd_model_path('protogen'), scheduler=scheduler, revision='fp16', torch_dtype=torch.float16)
text_pipe = text_pipe.to(device)
text_pipe.enable_attention_slicing()
image_pipe = StableDiffusionImg2ImgPipeline.from_pretrained(sd_model_path('protogen'), scheduler=scheduler, revision='fp16', torch_dtype=torch.float16)
image_pipe = image_pipe.to(device)
image_pipe.enable_attention_slicing()

# create ESRGAN model
upscale_model = arch.RRDBNet(3, 3, 64, 23, gc=32)
upscale_model.load_state_dict(torch.load(esrgan_model_path), strict=True)
upscale_model.eval()
upscale_model = upscale_model.to(device)

# create interrogation model
blip_num_beams = 32
blip_min_length = 4
blip_max_length = 30
blip_image_eval_size = 384
blip_config_path = os.path.join("./", "BLIP", "configs", "med_config.json")
blip_model = BLIP.models.blip.blip_decoder(pretrained=blip_model_path, image_size=blip_image_eval_size, vit='base', med_config=blip_config_path).half()
blip_model = blip_model.to(device)


@app.route('/txt2img', methods=['POST'])
def txt2img():
    prompt = request.form['prompt']
    negative_prompt = request.form['negativePrompt']
    out_file = request.form['outFile']
    seed = int(request.form['seed'])
    height = int(request.form['height'])
    width = int(request.form['width'])
    steps = int(request.form['steps'])

    generator = torch.Generator('cuda').manual_seed(seed)

    # run iterations and save output
    with autocast("cuda"):
        image = text_pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=steps,
            generator=generator,
            height=height,
            width=width
        ).images[0]

    # embed metadata in exif
    pnginfo = PngImagePlugin.PngInfo()
    pnginfo.add_text('parameters', f'Prompt: {prompt} Seed: {seed} Steps: {steps}')

    image.save(out_file, 'PNG', pnginfo=pnginfo)

    return 'OK'

@app.route('/img2img', methods=['POST'])
def img2img():
    prompt = request.form['prompt']
    negative_prompt = request.form['negativePrompt']
    in_file = request.form['inFile']
    out_file = request.form['outFile']
    seed = int(request.form['seed'])
    steps = int(request.form['steps'])
    strength = float(request.form['strength'])

    generator = torch.Generator('cuda').manual_seed(seed)

    in_image = Image.open(in_file).convert('RGB')

    # patches to unet_blocks.py in diffusers needed for this to work
    width, height = in_image.size
    aspect_ratio = width / height
    if max(width, height) == width:
        width = 512
        height = round(64 / aspect_ratio) * 8
    else:
        height = 512
        width = round(64 / aspect_ratio) * 8

    in_image = in_image.resize((width, height), resample=Image.Resampling.LANCZOS)

    # run iterations and save output
    with autocast("cuda"):
        image = image_pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            init_image=in_image,
            strength=strength,
            num_inference_steps=steps,
            generator=generator
        ).images[0]

    # embed metadata in exif
    pnginfo = PngImagePlugin.PngInfo()
    pnginfo.add_text('parameters', f'Prompt: {prompt} Seed: {seed} Steps: {steps} Strength: {strength}')

    image.save(out_file, 'PNG', pnginfo=pnginfo)

    return 'OK'

@app.route('/upscale', methods=['POST'])
def upscale():
    in_file = request.form['inFile']
    out_file = request.form['outFile']

    # read image
    img = cv2.imread(in_file, cv2.IMREAD_COLOR)
    img = img * 1.0 / 255
    img = torch.from_numpy(np.transpose(img[:, :, [2, 1, 0]], (2, 0, 1))).float()
    img_LR = img.unsqueeze(0)
    img_LR = img_LR.to(device)

    # write upscaled image
    with torch.no_grad():
        output = upscale_model(img_LR).data.squeeze().float().cpu().clamp_(0, 1).numpy()
    output = np.transpose(output[[2, 1, 0], :, :], (1, 2, 0))
    output = (output * 255.0).round()

    # downscale image so it fits on discord
    image_height, image_width, image_channels = output.shape
    print(f'Image size is {image_width}x{image_height} px')

    if image_width > 1536 or image_height > 1536:
        height = 1536
        width = 1536
        aspect_ratio = image_width / image_height

        if image_height > image_width:
            width = round(1536 / aspect_ratio)
        elif image_height < image_width:
            height = round(1536 / aspect_ratio)

        print(f'Resizing image to {width}x{height} px')
        output = cv2.resize(output, dsize=(width, height), interpolation=cv2.INTER_LANCZOS4)

    cv2.imwrite(out_file, output)

    return 'OK'

@app.route('/interrogate', methods=['POST'])
def interrogate():
    in_file = request.form['inFile']

    img = Image.open(in_file).convert('RGB')
    gpu_image = transforms.Compose([
        transforms.Resize((blip_image_eval_size, blip_image_eval_size), interpolation=InterpolationMode.BICUBIC),
        transforms.ToTensor(),
        transforms.Normalize((0.48145466, 0.4578275, 0.40821073), (0.26862954, 0.26130258, 0.27577711))
    ])(img).unsqueeze(0).type(torch.cuda.HalfTensor).to(device)

    with torch.no_grad():
        caption = blip_model.generate(gpu_image, sample=False, num_beams=blip_num_beams, min_length=blip_min_length, max_length=blip_max_length)

    return caption[0]