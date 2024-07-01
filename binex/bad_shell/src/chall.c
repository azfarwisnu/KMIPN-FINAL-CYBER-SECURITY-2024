#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <seccomp.h>
#include <sys/mman.h>

#define MAX_LEN 0x2000
#define MAX_READ 0x1000

char something[48] = "H1\xc0H1\xdbH1\xc9H1\xd2H1\xffH1\xf6M1\xc0M1\xc9M1\xd2M1\xdbM1\xe4M1\xedM1\xf6M1\xffH1\xe4H1\xed";
char badchars[2] = {0x0f, 0x05};

void setup() {
  setvbuf(stdin, NULL, _IONBF, 0);
  setvbuf(stdout, NULL, _IONBF, 0);
  setvbuf(stderr, NULL, _IONBF, 0);
}

void check(char *buf, int length) {
  for (int i = 0; i < length; i++) {
    for (int j = 0; j < sizeof(badchars); j++) {
      if (buf[i] == badchars[j]) {
        write(0, "[X] Badchars detected!\n", 23);
        exit(1337);
      }
    }
  }
}

void init() {
  scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_ALLOW);
  seccomp_rule_add(ctx, SCMP_ACT_KILL, SCMP_SYS(execve), 0);
  seccomp_rule_add(ctx, SCMP_ACT_KILL, SCMP_SYS(execveat), 0);
  seccomp_load(ctx);
}

int main() {
  setup();
  char *area = mmap((void *)0x1337C0DE0000, MAX_LEN, PROT_READ | PROT_WRITE | PROT_EXEC, MAP_FIXED | MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
  if (!area || area != (void *)0x1337C0DE0000) {
    puts("[X] Error!");
    return 0;
  }
  printf("Gimme your shellcode: ");
  memcpy(area, something, sizeof(something));
  read(0, (char *)(area + sizeof(something)), MAX_READ);

  // Check the shellcode for bad characters
  check(area, MAX_READ);

  init();
  (*(void(*)()) area)();
}
