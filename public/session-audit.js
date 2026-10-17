import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,collection,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const auth=getAuth(),db=getFirestore();let current=null,epoch=0;
async function record(event,u){try{await addDoc(collection(db,"sessionAudit"),{uid:u.uid,email:u.email,event,createdAt:serverTimestamp()})}catch(e){console.warn("DAVIVA session audit unavailable",e.code||e.message)}}
onAuthStateChanged(auth,async u=>{const v=++epoch;current=null;if(!u)return;try{const snap=await getDoc(doc(db,"kadro",u.uid));if(v!==epoch)return;const staff=snap.data();if(staff?.aktif===true&&staff["e-posta"]===u.email&&["admin","stok"].includes(staff.rol)){current=u;await record("SESSION_STARTED",u)}}catch(e){console.warn("DAVIVA session validation",e.code||e.message)}});
document.addEventListener("click",e=>{const target=e.target?.closest?.("#logout");if(target&&current){const u=current;current=null;record("SIGN_OUT_REQUESTED",u)}},true);
