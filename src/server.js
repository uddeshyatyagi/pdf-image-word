// Declaring
const express = require("express");
const multer = require("multer");
const groupdocs_parser_cloud= require("groupdocs-parser-cloud");
const app = express();
const fs = require("fs");
const pdf = require("pdfkit");
var Tesseract = require("tesseract.js");
var downloadpath;
// This code example demonstrates how to add your cliend ID and Secret in the code.
global.clientId = '147f967a-04dc-47c3-abea-0115e597f1b6';
global.clientSecret = 'def9f34f70db6db25081d8d716e1a853';
global.myStorage = "pdf2img";

const configuration = new groupdocs_parser_cloud.Configuration(clientId, clientSecret);
configuration.apiBaseUrl = "https://api.groupdocs.cloud";


//middlewares
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

const PORT = process.env.PORT | 5000;

var Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, __dirname + "/images");
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  }
});

var upload = multer({
  storage: Storage,
  fileFilter: function(req, file, cb) {
    checkfiletype(file, cb);
  }
}).single("image");

//checkfiletype function
function checkfiletype(file, cb) {
  const filetypes = /jpeg|jpg|pdf|png/;
  const extname = filetypes.test(file.originalname);

  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(" Error : Images Only !");
  }
}

//route
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

//download img
 var request = require('request');

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};


//uploadtocloud
app.post("/uploadtocloud", (req,res)=>{
  // This code example demonstrates how to upload a PDF to the cloud in node.js 
  // Construct FileApi
  let fileApi = groupdocs_parser_cloud.FileApi.fromConfig(configuration);

  // Input file path
  let resourcesFolder =  "C:\\Users\\Abhimanyu saini\\Desktop\\MINOR PROJECT -2\\pdf-image-word\\src\\images\\test.pdf";
  console.log(resourcesFolder);
  fs.readFile(resourcesFolder, (err, fileStream) => {
    // Upload file request
    let request = new groupdocs_parser_cloud.UploadFileRequest("test.pdf", fileStream, myStorage);
    // Upload file
    fileApi.uploadFile(request)
      .then(function (response){
        console.log("Successful");
        //Api initialization
        let parseApi = groupdocs_parser_cloud.ParseApi.fromConfig(configuration);

        // Input file path
        let fileInfo = new groupdocs_parser_cloud.FileInfo();
        fileInfo.filePath = "test.pdf";
        console.log(fileInfo);

        // define image options
        let options = new groupdocs_parser_cloud.ImagesOptions();
        options.fileInfo = fileInfo;

        // Image request
        let request = new groupdocs_parser_cloud.ImagesRequest(options);

        // Extract images
        let result,flag=0;
        (async function() {
           result = await parseApi.images(request);

           // Show results
        let images = result.images;
        images.forEach(image => {
          console.log("Image path in storage: " + image.path);
          console.log("Download url: " + image.downloadUrl);
          console.log("Image format: " + image.fileFormat + ". Page index: " + image.pageIndex);


          download(image.downloadUrl, "C:\\Users\\Abhimanyu saini\\Desktop\\MINOR PROJECT -2\\pdf-image-word\\src\\images\\test_0.jpeg", function(){
          console.log('done');
});       
          
        });
        })();
        
        // This code example demonstrates how to download images from the cloud using Node.js
        // Construct necessory api instances
        if(flag==1){
        var folderApi = groupdocs_parser_cloud.FolderApi.fromConfig(configuration);
        var fileApi = groupdocs_parser_cloud.FileApi.fromConfig(configuration);

        // Get files list request
        var filesListRequest = new groupdocs_parser_cloud.GetFilesListRequest("parser/images/sample_pdf/", myStorage);

        // Get files list
        (async function() {
        var filesList = await folderApi.getFilesList(filesListRequest);
        console.log("working");
        for (var count = 0; count < filesList.value.length; count++) {
          // Download file request
          let request = new groupdocs_parser_cloud.DownloadFileRequest(filesList.value[count].path, myStorage);

          // Download file
          let response = await fileApi.downloadFile(request);

          // Save file to the folder on disk
          fs.writeFile("C:\\Users\\Abhimanyu saini\\Desktop\\MINOR PROJECT -2\\pdf-image-word\\src\\images\\" + filesList.value[count].name, response, "binary", function (err) { 
            console.log("error");
          });
          console.log(response);
        }
        })();
      }
        res.redirect('/');
        
      })
      .catch(function(error){
        console.log("Error:" + error.message);
      });
  });

});



app.post("/upload", (req, res) => {
  console.log(req.file);
  upload(req, res, err => {
    if (err) {
      res.render("index", { msg: err });
    } else {
      if (req.file == undefined) {
        res.render("index", {
          msg: " Image/PDF not Selected !"
        });
      } else {
        console.log(req.file);
        var image = fs.readFileSync(
          __dirname + "/images/" + req.file.originalname,
          {
            encoding: null
          }
        );
        Tesseract.recognize(image)
          .progress(function(p) {
            console.log("progress", p);
          })
          .then(function(result) {
            // res.send(result.text);
            res.render("display", {
              data: result.text,
              path: __dirname + "/images/" + req.file.originalname,
              fname: req.file.originalname
            });

            var myDoc = new pdf();
            myDoc.pipe(
              fs.createWriteStream(`./pdfs/${req.file.originalname}.pdf`)
            );
            myDoc
              .font("Times-Roman")
              .fontSize(24)
              .text(`${result.text}`, 100, 100);
            myDoc.end();
            downloadpath = __dirname + "//pdfs//" + req.file.originalname;
            // app.get("/download", (req, res) => {
            //   const file = `./pdfs/${req.file.originalname}.pdf`;
            //   res.download("downloadpath");
            //   res.download(file);
            // });
            
          });
      }
    }
  });
});

app.get("/download", (req, res) => {
  // const file = `./pdfs/${req.file.originalname}.pdf`;
  res.download("downloadpath");
});

//


app.get("/showdata", (req, res) => {});

app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});

