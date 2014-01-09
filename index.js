var express = require("express"),
	im = require("imagemagick"),
	fs = require("fs"),
	cached_image_path = "library/imagecache/"
	source_image_path = "library/images/unclephil/",
	app = express();


app.get("/", function(req, res){
	var body = "Hello, world!";
	res.setHeader("Content-Type", "text/plain");
	res.setHeader("Content-Length", Buffer.byteLength(body));
	res.end(body);
});

app.get(/^\/(\d+)\/(\d+)/, function(req, res){
	var width = req.params[0], 
		height = req.params[1],
		cached_image = get_cached_image(width, height),
		source_image;

	if(cached_image)
	{
		display_image(res, cached_image);
	}
	else
	{
		source_image = get_source_image(width, height)
		display_source_image(res, source_image, width, height);
	}
});

function get_cached_image(width, height)
{
	var path = cached_image_path + width + "x" + height + ".jpg",
		ret = false;

	if(fs.existsSync(path))
	{
		ret = path;
	}

	return ret;
}

function display_source_image(res, image, width, height)
{
	var w, 
		h, 
		aspect_ratio, 
		new_width, 
		new_filename, 
		target_aspect_ratio = parseFloat(width/height).toFixed(5);


	im.identify(image, function(err, features){
		w = features.width;
		h = features.height;
		aspect_ratio = parseFloat(w / h).toFixed(5);


		if(aspect_ratio != target_aspect_ratio)
		{
			new_width = Math.floor(h * target_aspect_ratio);
			new_filename = source_image_path + generate_file_name(target_aspect_ratio, new_width, h);

			im.crop({
				srcPath: image,
				width: new_width,
				height: h,
			}, function(err, stdout, stderr){
				fs.writeFile(new_filename, stdout, "binary", function(){
					display_image_at_size(res, new_filename, width, height);
				});
			});
		}
		else
		{
			display_image_at_size(res, image, width, height);
		}
	});
}

function display_image_at_size(res, image, width, height)
{
	var cache_file_name = cached_image_path + width + "x" + height + ".jpg";
	fs.readFile(image, function(err, image_data){
		im.resize({
			srcData: image_data,
			width: width,
			height: height
		}, function (err, stdout, stderr){
			fs.writeFile(cache_file_name, stdout, "binary", function(){
				res.sendfile(cache_file_name);
			});
		});
	});
}

function display_image(res, image)
{
	res.sendfile(image);
}

function generate_file_name(aspect_ratio, width, height)
{
	aspect_ratio = parseFloat(aspect_ratio).toFixed(5);
	return String(aspect_ratio).replace(".", "_") + "-" + width + "-" + height + ".jpg";
}

function get_image_aspect_ratio(image)
{
	var ret;
	ret = image.split("/").pop().split("-").shift().replace("_", ".");
	ret = parseFloat(ret).toFixed(5);

	return ret;
}

function get_source_image(width, height)
{
	var aspect_ratio = parseFloat((width / height).toFixed(5)),
		source_images = fs.readdirSync(source_image_path),
		index,
		image,
		source_image_aspect_ratio;

	for(index in source_images)
	{
		image = source_images[index];
		if(get_image_aspect_ratio(image) >= aspect_ratio)
		{
			break;
		}
	}

	return source_image_path + image;
}

app.listen(process.env.PORT || 5000);