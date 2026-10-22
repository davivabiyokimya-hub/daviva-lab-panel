import {getApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {createMultiLogin} from "./auth/multi-login.js";

const auth=getAuth(getApp());
const multi=createMultiLogin(auth);
const googleButton=document.getElementById("login");
if(googleButton){
  const open=document.createElement("button");
  open.type="button";open.className="btn alt";open.textContent="E-posta ile Giriş";
  open.id="emailLoginOpen";googleButton.after(open);
  const dialog=document.createElement("dialog");dialog.id="emailLoginDialog";
  dialog.style.cssText="border:1px solid #cbd5e1;border-radius:16px;padding:22px;width:min(94vw,420px);box-shadow:0 25px 75px #0005";
  const form=document.createElement("form");form.method="dialog";
  const title=document.createElement("h3");title.textContent="DAVIVA LAB • E-posta ile Giriş";
  const email=document.createElement("input");email.type="email";email.autocomplete="username";email.required=true;email.placeholder="E-posta";email.style.cssText="width:100%;padding:12px;margin:8px 0";
  const password=document.createElement("input");password.type="password";password.autocomplete="current-password";password.required=true;password.placeholder="Şifre";password.style.cssText="width:100%;padding:12px;margin:8px 0";
  const error=document.createElement("p");error.setAttribute("role","alert");error.style.cssText="color:#a23827;font-size:13px";
  const submit=document.createElement("button");submit.type="submit";submit.className="btn";submit.textContent="Giriş Yap";
  const close=document.createElement("button");close.type="button";close.className="btn alt";close.textContent="Vazgeç";close.style.marginLeft="8px";close.onclick=()=>dialog.close();
  const reset=document.createElement("button");reset.type="button";reset.className="btn alt";reset.textContent="Şifremi Unuttum";reset.style.marginTop="12px";
  const info=document.createElement("p");info.className="hint";info.textContent="Mevcut Google hesabınızla aynı e-posta adresini kullanmak tek başına hesapları birleştirmez. Önce yöneticinizle hesap bağlantısını doğrulayın.";
  form.append(title,email,password,error,submit,close,document.createElement("div"),reset,info);
  dialog.append(form);document.body.append(dialog);
  open.onclick=()=>{error.textContent="";dialog.showModal();email.focus()};
  form.addEventListener("submit",async event=>{event.preventDefault();submit.disabled=true;error.textContent="";try{await multi.emailLogin(email.value,password.value);password.value="";dialog.close()}catch(e){error.textContent="Giriş yapılamadı. Bilgilerinizi ve hesap yetkinizi kontrol edin."}finally{submit.disabled=false}});
  reset.onclick=async()=>{if(!email.validity.valid){error.textContent="Önce geçerli e-posta adresinizi girin.";return}reset.disabled=true;try{await multi.resetPassword(email.value);error.textContent="Hesap uygunsa şifre sıfırlama e-postası gönderilir."}catch(e){error.textContent="İşlem tamamlanamadı. Yöneticiye başvurun."}finally{reset.disabled=false}};
  onAuthStateChanged(auth,u=>{open.classList.toggle("hidden",!!u);if(u&&dialog.open)dialog.close()});
}
