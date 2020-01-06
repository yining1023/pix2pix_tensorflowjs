# pix2pix in tensorflow.js

# This repo is moved to [https://github.com/yining1023/pix2pix_tensorflowjs_lite](https://github.com/yining1023/pix2pix_tensorflowjs_lite)

See a live demo here: [https://yining1023.github.io/pix2pix_tensorflowjs/](https://yining1023.github.io/pix2pix_tensorflowjs/)

<a href="https://ibb.co/e0oUUd"><img src="https://preview.ibb.co/fXP3pd/Screen_Shot_2018_06_17_at_11_06_09_PM.png" alt="Screen_Shot_2018_06_17_at_11_06_09_PM" border="0"></a>

Try it yourself: Download/clone the repository and run it locally:
```bash
git clone https://github.com/yining1023/pix2pix_tensorflowjs.git
cd pix2pix_tensorflowjs
python3 -m http.server
```



Credits: This project is based on [affinelayer](https://github.com/affinelayer)'s [pix2pix-tensorflow](https://github.com/affinelayer/pix2pix-tensorflow). I want to thank [christopherhesse](https://github.com/christopherhesse), [nsthorat](https://github.com/nsthorat), and [dsmilkov](dsmilkov) for their help and suggestions from this Github [issue](https://github.com/tensorflow/tfjs/issues/79).



## How to train a pix2pix(edges2xxx) model from scratch
- 1. Prepare the data
- 2. Train the model
- 3. Test the model
- 4. Export the model
- 5. Port the model to tensorflow.js
- 6. Create an interactive interface in the browser



### 1. Prepare the data

- 1.1 Scrape images from google search
- 1.2 Remove the background of the images
- 1.3 Resize all images into 256x256 px
- 1.4 Detect edges of all images
- 1.5 Combine input images and target images
- 1.6 Split all combined images into two folders: `train` and `val`

Before we start, check out [affinelayer](https://github.com/affinelayer)'s [Create your own dataset](https://github.com/affinelayer/pix2pix-tensorflow#creating-your-own-dataset). I followed his instrustion for steps 1.3, 1.5 and 1.6.


#### 1.1 Scrape images from google search
We can create our own target images. But for this edge2pikachu project, I downloaded a lot of images from google. I'm using this [google_image_downloader](https://github.com/atif93/google_image_downloader) to download images from google.
After downloading the repo above, run -
```
$ python image_download.py <query> <number of images>
```
It will download images and save it to the current directory.


#### 1.2 Remove the background of the images
Some images have some background. I'm using [grabcut](https://docs.opencv.org/trunk/d8/d83/tutorial_py_grabcut.html) with OpenCV to remove background
Check out the script here: [https://github.com/yining1023/pix2pix-tensorflow/blob/master/tools/grabcut.py](https://github.com/yining1023/pix2pix-tensorflow/blob/master/tools/grabcut.py)
To run the script-
```
$ python grabcut.py <filename>
```
It will open an interactive interface, here are some instructions: [https://github.com/symao/InteractiveImageSegmentation](https://github.com/symao/InteractiveImageSegmentation)
Here's an example of removing background using grabcut:

<a href="https://ibb.co/iRp9LH"><img src="https://preview.ibb.co/du2kuc/Screen_Shot_2018_03_13_at_7_03_28_AM.png" alt="Screen Shot 2018 03 13 at 7 03 28 AM" border="0" with="500px"/></a>


#### 1.3 Resize all images into 256x256 px
Download [pix2pix-tensorflow](https://github.com/affinelayer/pix2pix-tensorflow) repo.
Put all images we got into `photos/original` folder
Run - 
```
$ python tools/process.py --input_dir photos/original --operation resize --output_dir photos/resized
```
We should be able to see a new folder called `resized` with all resized images in it.


#### 1.4 Detect edges of all images
The script that I use to detect edges of images from one folder at once is here: [https://github.com/yining1023/pix2pix-tensorflow/blob/master/tools/edge-detection.py](https://github.com/yining1023/pix2pix-tensorflow/blob/master/tools/edge-detection.py), we need to change the path of the input images directory on [line 31](https://github.com/yining1023/pix2pix-tensorflow/blob/3e0d6c8613b3aa69adffe5484989bbe2c82b2c57/tools/edge-detection.py#L31), and create a new empty folder called `edges` in the same directory.
Run - 
```
$ python edge-detection.py
```
We should be able to see edged-detected images in the `edges` folder.
Here's an example of edge detection: left(original) right(edge detected)

<a href="https://imgbb.com/"><img src="https://image.ibb.co/eBDGZc/0_batch2.png" alt="0_batch2" border="0" with="300px"></a>
<a href="https://imgbb.com/"><img src="https://image.ibb.co/hW410H/0_batch2_2.png" alt="0_batch2_2" border="0" with="300px"></a>


#### 1.5 Combine input images and target images
```
python tools/process.py --input_dir photos/resized --b_dir photos/blank --operation combine --output_dir photos/combined
```

Here is an example of the combined image: 
Notice that the size of the combined image is 512x256px. The size is important for training the model successfully.

<a href="https://imgbb.com/"><img src="https://image.ibb.co/kYHVvH/0_batch2.png" alt="0_batch2" border="0" with="300px"></a>

Read more here: [affinelayer](https://github.com/affinelayer)'s [Create your own dataset](https://github.com/affinelayer/pix2pix-tensorflow#creating-your-own-dataset)


#### 1.6 Split all combined images into two folders: `train` and `val`
```
python tools/split.py --dir photos/combined
```
Read more here: [affinelayer](https://github.com/affinelayer)'s [Create your own dataset](https://github.com/affinelayer/pix2pix-tensorflow#creating-your-own-dataset)

I collected 305 images for training and 78 images for testing.


### 2. Train the model
```
# train the model
python pix2pix.py --mode train --output_dir pikachu_train --max_epochs 200 --input_dir pikachu/train --which_direction BtoA
```
Read more here: [https://github.com/affinelayer/pix2pix-tensorflow#getting-started](https://github.com/affinelayer/pix2pix-tensorflow#getting-started)

I used the High Power Computer(HPC) at NYU to train the model. You can see more instruction here: [https://github.com/cvalenzuela/hpc](https://github.com/cvalenzuela/hpc). You can request GPU and submit a job to HPC, and use tunnels to tranfer large files between the HPC and your computer.

The training takes me 4 hours and 16 mins. After train, there should be a `pikachu_train` folder with `checkpoint` in it.
If you add `--ngf 32 --ndf 32` when training the model: python pix2pix.py --mode train --output_dir pikachu_train --max_epochs 200 --input_dir pikachu/train --which_direction BtoA --ngf 32 --ndf 32, the model will be smaller 13.6 MB, and it will take less time to train.


### 3. Test the model
```
# test the model
python pix2pix.py --mode test --output_dir pikachu_test --input_dir pikachu/val --checkpoint pikachu_train
```
After testing, there should be a new folder called `pikachu_test`. In the folder, if you open the `index.html`, you should be able to see something like this in your browser:

<a href="https://ibb.co/cJiLvH"><img src="https://preview.ibb.co/kkFB2x/Screen_Shot_2018_03_15_at_8_42_48_AM.png" alt="Screen_Shot_2018_03_15_at_8_42_48_AM" border="0" width="400px"></a><br />

Read more here: [https://github.com/affinelayer/pix2pix-tensorflow#getting-started](https://github.com/affinelayer/pix2pix-tensorflow#getting-started)


### 4. Export the model
```
python pix2pix.py --mode export --output_dir /export/ --checkpoint /pikachu_train/ --which_direction BtoA
```
It will create a new `export` folder

### 5. Port the model to tensorflow.js
I followed [affinelayer](https://github.com/affinelayer)'s instruction here: [https://github.com/affinelayer/pix2pix-tensorflow/tree/master/server#exporting](https://github.com/affinelayer/pix2pix-tensorflow/tree/master/server#exporting)

```
cd server
python tools/export-checkpoint.py --checkpoint ../export --output_file static/models/pikachu_BtoA.pict
```
We should be able to get a file named `pikachu_BtoA.pict`, which is 54.4 MB.
If you add `--ngf 32 --ndf 32` when training the model: python pix2pix.py --mode train --output_dir pikachu_train --max_epochs 200 --input_dir pikachu/train --which_direction BtoA --ngf 32 --ndf 32, the model will be smaller 13.6 MB, and it will take less time to train.

### 6. Create an interactive interface in the browser
Copy the model we get from step 5 to the `models` folder.

