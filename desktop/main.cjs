"use strict";
const {app,BrowserWindow,shell,dialog}=require("electron");
const APP_URL="https://davivabiyokimya-hub.github.io/daviva-lab-panel/";
const APP_ORIGIN=new URL(APP_URL).origin;
const GOOGLE_ORIGINS=new Set(["https://accounts.google.com","https://accounts.youtube.com"]);
let mainWindow;
function isTrustedApp(url){try{const u=new URL(url);return u.origin===APP_ORIGIN&&u.pathname.startsWith("/daviva-lab-panel/")}catch{return false}}
function isGoogleAuth(url){try{const u=new URL(url);return GOOGLE_ORIGINS.has(u.origin)}catch{return false}}
function createWindow(){
 mainWindow=new BrowserWindow({width:1440,height:900,minWidth:1024,minHeight:680,title:"DAVIVA LAB",backgroundColor:"#102b48",webPreferences:{preload:require("node:path").join(__dirname,"preload.cjs"),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 mainWindow.removeMenu();
 mainWindow.webContents.setWindowOpenHandler(({url})=>{
  if(isGoogleAuth(url)||isTrustedApp(url))return {action:"allow",overrideBrowserWindowOptions:{width:560,height:750,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}}};
  if(url.startsWith("https://"))shell.openExternal(url);return {action:"deny"};
 });
 mainWindow.webContents.on("will-navigate",(event,url)=>{if(!isTrustedApp(url)&&!isGoogleAuth(url)){event.preventDefault();if(url.startsWith("https://"))shell.openExternal(url)}});
 mainWindow.webContents.on("did-fail-load",(_event,code,description,url,isMainFrame)=>{if(isMainFrame)dialog.showMessageBox(mainWindow,{type:"warning",title:"DAVIVA LAB bağlantısı",message:"DAVIVA LAB yüklenemedi.",detail:description+" ("+code+")\n"+url})});
 mainWindow.loadURL(APP_URL);
}
app.whenReady().then(()=>{createWindow();app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
