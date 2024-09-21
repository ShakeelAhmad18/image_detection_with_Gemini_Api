const express=require('express')
const dotenv=require('dotenv').config()
const fs=require('fs')
const fsPromises=fs.promises;
const pdfkit=require('pdfkit')
const multer=require('multer')
const { GoogleGenerativeAI }=require("@google/generative-ai");
const path=require('path')
const cors=require('cors');
const { rejects } = require('assert');

const app=express()


const port=8000;

//config the multer
const upload=multer({ dest:'upload/' })
app.use(express.json({limit:'10mb'}))
app.use(cors({
    origin:'http://localhost:5173',
   credentials:true
}))


//initiallized Google Generative AI
const genAI=new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

app.use(express.static('public'))

//routes

app.post('/analyze',upload.single('image'),async (req,res)=>{

    try {

        if(!req.file){
            res.status(400).json({error:'Please Add Image'})
        }
    
        const imagePath=req.file.path;
    
        const imageData=await fsPromises.readFile(imagePath,{
            encoding:'base64'
        })

        //use gemini api to analyze the image
        const model=genAI.getGenerativeModel({
            model:"gemini-1.5-flash"
        })

         const result=await model.generateContent([
            'Analyze this plant image and provide detailed analysis of its species,health,care recommendations,its charactristics,care instructions and any interesting facts.please provide the plain text without using any markdown formetting.',{
                inlineData:{
                    mimeType:req.file.mimetype,
                    data:imageData
                }
            }
         ]);

         const plantInfo=result.response.text();
         //remove the upload image
         await fsPromises.unlink(imagePath)

        //send res

        res.json({result:plantInfo,image:`data:${req.file.mimetype};base64,${imageData}`})
        
    } catch (error) {

        res.status(500).json({error:error.message})
        
    }

})

//download the pdf

app.post('/download',express.json(),async (req,res)=>{
 const {result,image}=req.body;


 try {

     //INSURE   drectory exist
    const resportDir=path.join(__dirname,'reports')
    await fsPromises.mkdir(resportDir,{recursive:true})

    //generate pdf

    const filename=`plant_analysis_report_${Date.now()}.pdf`
    const filePath=path.join(resportDir,filename)
    const writeStream=fs.createWriteStream(filePath)
    const doc=new pdfkit();
    doc.pipe(writeStream)

    //add content to the PDF
    doc.fontSize(24).text('Plant Analysis Report',{
        align:'center'
    })
    doc.moveDown()
    doc.fontSize(24).text(`Date: ${new Date().toLocaleDateString()}`)
    doc.moveDown()
    doc.fontSize(14).text(result,{align:'left'})

    //insert iamge to pdf
    //insert image to pdf
if(image){
    const base64Data = image.replace(/^data:image\/\w+;base64,/, ""); // Corrected regex
    const buffer = Buffer.from(base64Data, "base64");
    doc.moveDown();
    doc.image(buffer, {
        fit: [500, 300],
        align: 'center',
        valign: 'center'
    });
}

   doc.end();
   //wait the pdf to created
   await new Promise((resolve,reject)=>{

    writeStream.on('finish',resolve)
    writeStream.on('error',reject)

   })

   res.download(filePath,(err)=>{

    if(err){
        res.status(500).json({error:'Error DownLoading the PDF Report'})
    }

    fsPromises.unlink(filePath)

   })

 } catch (error) {
    console.error('Error generating the PDF',error)
    res.status(500).json({error:'Error Downloading the pdf'})
 }

    
})



//start the server
app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})







