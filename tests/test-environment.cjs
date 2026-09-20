// Read-only detection regression: disposable profiles; emulated screen/DPR are not hardware measurements.
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{const results=[];for(const [name,exe] of [['Chrome','C:/Program Files/Google/Chrome/Application/chrome.exe'],['Edge','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']]){
 const browser=await chromium.launch({executablePath:exe,headless:false});
 try{
 const context=await browser.newContext({offline:true,viewport:{width:1280,height:800},screen:{width:2560,height:1440},deviceScaleFactor:1.5});
 const p=await context.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await p.goto(require('url').pathToFileURL(require('path').resolve('overwatch-sensitivity.html')).href);
 assert(await p.locator('#environmentCard').isVisible());assert.match(await p.locator('#environmentSummary').innerText(),new RegExp(name));
 const snapshot=()=>p.evaluate(()=>({state:JSON.stringify(state),s0:$('s0').value,fov:$('fov').value,aspect:$('aspect').value,dpi:$('dpi').value,stored:localStorage.getItem(KEY)}));
 const before=await snapshot();await p.evaluate(()=>{renderEnvironment();renderEnvironment();});assert.deepEqual(await snapshot(),before);
 assert(Math.abs(await p.evaluate(()=>readEnvironment().pixelRatio)-1.5)<1e-6);assert.equal(await p.locator('#dpi').inputValue(),'');
 await p.locator('#environmentCard summary').click();assert.match(await p.locator('#environmentRows').innerText(),/与鼠标档位无关/);
 await p.evaluate(()=>{Object.defineProperty(screen,'width',{value:3440,configurable:true});Object.defineProperty(screen,'height',{value:1440,configurable:true});window.dispatchEvent(new Event('resize'));});
 assert.equal(await p.locator('#aspect').inputValue(),before.aspect);await p.locator('#useScreenAspect').click();
 assert.equal(Number(await p.locator('#aspect').inputValue()),3440/1440);assert.equal(await p.locator('#s0').inputValue(),before.s0);assert.equal(await p.locator('#fov').inputValue(),before.fov);
 await p.locator('#fixedSettings').check();await p.locator('#saveSettings').click();assert(await p.locator('#useScreenAspect').isDisabled());
 const saved=await p.evaluate(()=>JSON.stringify(state.settings));await p.evaluate(()=>{Object.defineProperty(screen,'width',{value:1920,configurable:true});renderEnvironment();});assert.equal(await p.evaluate(()=>JSON.stringify(state.settings)),saved);
 await p.reload();assert.equal(Number(await p.locator('#aspect').inputValue()),3440/1440);assert.equal(await p.evaluate(()=>state.settings.dpi),null);
 assert.equal(await p.evaluate(()=>{try{validateState(copy(state));return true;}catch(e){return e.message;}}),true);
 assert((await p.evaluate(()=>OWCore.selfTests())).every(x=>x.pass));assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 await p.locator('#environmentCard summary').click();await p.screenshot({path:'tests/screenshot-'+name+'-environment.png',fullPage:true});
 results.push({browser:name,version:browser.version(),headless:false,offline:true,checks:['自动显示浏览器与屏幕','读取不修改表单/状态/存储','DPR 不冒充鼠标 DPI','不同屏幕比例不自动覆盖游戏比例','确认后填写非常见比例','已保存设置保护','刷新恢复非常见比例','旧数据结构仍可导入','20 项核心自检通过','无网络请求或脚本异常'],passed:true});console.log(name+' readonly environment checks passed');
 }finally{await browser.close();}
 }fs.writeFileSync('tests/environment-test-results.json',JSON.stringify({testedAt:new Date().toISOString(),results,hardwareDpiValidation:'not claimed'},null,2));
})().catch(e=>{console.error(e);process.exit(1);});
