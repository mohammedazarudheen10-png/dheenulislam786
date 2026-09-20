<script setup>
import { ref, onMounted } from 'vue'

const name=ref(''), email=ref(''), status=ref(''), loading=ref(false)
const admin=ref(false), username=ref(''), password=ref(''), loginStatus=ref('')
const users=ref([]), search=ref('')

async function submit(){
 status.value=''; loading.value=true
 try{
  const r=await fetch('/api/submissions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:name.value,email:email.value})})
  const d=await r.json(); if(!r.ok) throw new Error(d.message)
  status.value=d.message; name.value=''; email.value=''
 }catch(e){status.value=e.message||'Unable to submit.'}finally{loading.value=false}
}
async function login(){
 loginStatus.value=''
 const r=await fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:username.value,password:password.value})})
 const d=await r.json()
 if(!r.ok){loginStatus.value=d.message;return}
 admin.value=true; password.value=''; await loadUsers()
}
async function loadUsers(){
 const r=await fetch('/api/admin/submissions?search='+encodeURIComponent(search.value))
 if(r.ok) users.value=await r.json()
}
async function logout(){await fetch('/api/admin/logout',{method:'POST'});admin.value=false;users.value=[]}
onMounted(async()=>{const r=await fetch('/api/admin/me');admin.value=(await r.json()).authenticated;if(admin.value)loadUsers()})
</script>

<template>
<header class="nav"><strong>dheenulislam786</strong><a href="#contact">Contact</a></header>
<main>
<section class="hero"><span>STARTUP • INNOVATION • DIGITAL</span><h1>Turning ideas into simple digital experiences.</h1><p>Welcome to dheenulislam786. Explore our startup portfolio and connect with us.</p><a class="btn" href="#contact">Let's connect</a></section>
<section class="section"><span>WHAT WE DO</span><h2>Focused on useful technology.</h2><div class="cards"><article><h3>Digital Products</h3><p>Practical digital experiences built around real needs.</p></article><article><h3>Innovation</h3><p>Simple ideas, fast experimentation and clean execution.</p></article><article><h3>Growth</h3><p>Technology foundations that grow with the business.</p></article></div></section>
<section id="contact" class="contact"><div><span>CONTACT</span><h2>Let's talk.</h2><p>Leave your details and we'll keep your information for follow-up.</p></div><form @submit.prevent="submit"><label>Name<input v-model="name" required maxlength="150"></label><label>Email<input v-model="email" required type="email" maxlength="255"></label><button class="btn" :disabled="loading">{{loading?'Submitting…':'Submit'}}</button><p>{{status}}</p></form></section>
<section class="admin">
<h2>Admin</h2>
<div v-if="!admin"><input v-model="username" placeholder="Username"><input v-model="password" type="password" placeholder="Password"><button class="btn" @click="login">Login</button><p>{{loginStatus}}</p></div>
<div v-else><div class="adminbar"><input v-model="search" placeholder="Search name/email" @keyup.enter="loadUsers"><button class="btn" @click="loadUsers">Search</button><button class="btn" @click="logout">Logout</button></div><table><thead><tr><th>Name</th><th>Email</th><th>Date</th></tr></thead><tbody><tr v-for="u in users" :key="u.id"><td>{{u.name}}</td><td>{{u.email}}</td><td>{{new Date(u.created_at).toLocaleString()}}</td></tr></tbody></table></div>
</section>
</main><footer>© 2026 dheenulislam786</footer>
</template>
