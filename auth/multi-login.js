import {GoogleAuthProvider,OAuthProvider,signInWithPopup,signInWithEmailAndPassword,sendPasswordResetEmail,linkWithCredential,EmailAuthProvider} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

/**
 * Opt-in authentication adapter. Does not modify the existing Google login.
 * Caller must enforce kadro/{uid}, active flag, verified email and role checks.
 * Username resolution MUST be performed by an authenticated/attested server endpoint
 * with rate limits and non-enumerating responses; never query public kadro.
 */
export function createMultiLogin(auth,{resolveUsername}={}){
  const normalizeEmail=value=>String(value??"").trim().toLowerCase();
  async function emailLogin(email,password){
    if(!normalizeEmail(email)||!password) throw new Error("E-posta ve şifre gerekli.");
    return signInWithEmailAndPassword(auth,normalizeEmail(email),password);
  }
  async function usernameLogin(username,password){
    if(typeof resolveUsername!=="function") throw new Error("Güvenli kullanıcı adı servisi yapılandırılmadı.");
    const name=String(username??"").trim();
    if(!/^[a-zA-Z0-9._-]{3,48}$/.test(name)||!password) throw new Error("Giriş bilgileri geçersiz.");
    const email=await resolveUsername(name);
    if(!email) throw new Error("Giriş bilgileri geçersiz.");
    return emailLogin(email,password);
  }
  async function googleLogin(){return signInWithPopup(auth,new GoogleAuthProvider());}
  async function microsoftLogin(){
    const provider=new OAuthProvider("microsoft.com");
    provider.setCustomParameters({prompt:"select_account"});
    return signInWithPopup(auth,provider);
  }
  async function resetPassword(email){
    if(!normalizeEmail(email))throw new Error("E-posta gerekli.");
    return sendPasswordResetEmail(auth,normalizeEmail(email));
  }
  async function linkPasswordToCurrentUser(password){
    const current=auth.currentUser;
    if(!current||!current.email||!current.emailVerified)throw new Error("Doğrulanmış mevcut oturum gerekli.");
    return linkWithCredential(current,EmailAuthProvider.credential(current.email,password));
  }
  return {emailLogin,usernameLogin,googleLogin,microsoftLogin,resetPassword,linkPasswordToCurrentUser};
}
