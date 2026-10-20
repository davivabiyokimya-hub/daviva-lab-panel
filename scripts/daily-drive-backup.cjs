const admin=require("firebase-admin");
const {google}=require("googleapis");
const {Readable}=require("node:stream");
async function main(){
 const credentials=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
 admin.initializeApp({credential:admin.credential.cert(credentials)});
 const oauth=new google.auth.OAuth2(process.env.DRIVE_CLIENT_ID,process.env.DRIVE_CLIENT_SECRET);
 oauth.setCredentials({refresh_token:process.env.DRIVE_REFRESH_TOKEN});
 const drive=google.drive({version:"v3",auth:oauth});
 const names=["products","stockMovements","stockCounts","suppliers","kadro","smartOrders","climateDevices","climateReadings","climateSensorProfiles","lotTransfers","dispatchArchive","msdsDocuments"];
 const collections={};
 for(const name of names){const snapshot=await admin.firestore().collection(name).get();collections[name]=snapshot.docs.map(doc=>({id:doc.id,data:doc.data()}));}
 const date=new Date().toISOString().slice(0,10);
 const data=Buffer.from(JSON.stringify({format:"daviva-lab-backup",version:2,date,collections},null,2));
 const result=await drive.files.create({requestBody:{name:"DAVIVA_LAB_YEDEK_"+date+".json",parents:[process.env.DRIVE_BACKUP_FOLDER_ID],mimeType:"application/json"},media:{mimeType:"application/json",body:Readable.from([data])},fields:"id,name"});
 console.log("Backup:",result.data.name);
}
main().catch(error=>{console.error(error);process.exitCode=1});
