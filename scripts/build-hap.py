from pathlib import Path
import subprocess,os,shutil,json,sys
root=Path(__file__).resolve().parents[1]
dev=Path('/Applications/DevEco-Studio.app/Contents')
roles=sys.argv[1:] or ['tablet','phone']
for role in roles:
 src=root/'apps/harmony'/role
 target=Path.home()/'.cache'/f'mobile-input-{role}'
 target.mkdir(parents=True,exist_ok=True)
 shutil.copy2(root/'AGENTS.md',target/'AGENTS.md')
 subprocess.run(['rsync','-a','--exclude','build','--exclude','.hvigor','--exclude','oh_modules','--exclude','/build-profile.json5',str(src)+'/',str(target)+'/'],check=True)
 for shared in (root/'apps/harmony/shared').glob('*.ets'):shutil.copy2(shared,target/'entry/src/main/ets'/shared.name)
 config=src/'build-profile.json5'
 if config.exists():shutil.copy2(config,target/'build-profile.json5')
 elif not (target/'build-profile.json5').exists():shutil.copy2(src/'build-profile.example.json5',target/'build-profile.json5')
 resources=target/'entry/src/main/resources/rawfile/web'
 if resources.exists():shutil.rmtree(resources)
 shutil.copytree(root/'dist',resources)
 env=os.environ.copy();env.update(JAVA_HOME=str(dev/'jbr/Contents/Home'),DEVECO_SDK_HOME=str(dev/'sdk'),NODE_HOME=str(dev/'tools/node'))
 env['PATH']=str(dev/'tools/node/bin')+':'+str(dev/'jbr/Contents/Home/bin')+':'+env['PATH']
 r=subprocess.run([str(dev/'tools/hvigor/bin/hvigorw'),'assembleHap','-p','product=default','--no-daemon'],cwd=target,env=env)
 if r.returncode:sys.exit(r.returncode)
 out=root/'artifacts/hap'/role;out.mkdir(parents=True,exist_ok=True)
 for f in (target/'entry/build').rglob('*.hap'):shutil.copy2(f,out/f.name)
 print('HAP_OUTPUT',out)
