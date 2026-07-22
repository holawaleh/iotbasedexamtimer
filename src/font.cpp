#include "font.h"
#include "config.h"

static const uint8_t font5x7[][5] = {
  {0x3E, 0x51, 0x49, 0x45, 0x3E}, // 0
  {0x00, 0x42, 0x7F, 0x40, 0x00}, // 1
  {0x42, 0x61, 0x51, 0x49, 0x46}, // 2
  {0x21, 0x41, 0x45, 0x4B, 0x31}, // 3
  {0x18, 0x14, 0x12, 0x7F, 0x10}, // 4
  {0x27, 0x45, 0x45, 0x45, 0x39}, // 5
  {0x3C, 0x4A, 0x49, 0x49, 0x30}, // 6
  {0x01, 0x71, 0x09, 0x05, 0x03}, // 7
  {0x36, 0x49, 0x49, 0x49, 0x36}, // 8
  {0x06, 0x49, 0x49, 0x29, 0x1E}, // 9
  {0x00, 0x36, 0x36, 0x00, 0x00}, // :
  {0x7E, 0x11, 0x11, 0x11, 0x7E}, // A
  {0x7F, 0x49, 0x49, 0x49, 0x36}, // B
  {0x3E, 0x41, 0x41, 0x41, 0x22}, // C
  {0x7F, 0x41, 0x41, 0x22, 0x1C}, // D
  {0x7F, 0x49, 0x49, 0x49, 0x41}, // E
  {0x7F, 0x09, 0x09, 0x09, 0x01}, // F
  {0x3E, 0x41, 0x49, 0x49, 0x7A}, // G
  {0x7F, 0x08, 0x08, 0x08, 0x7F}, // H
  {0x00, 0x41, 0x7F, 0x41, 0x00}, // I
  {0x20, 0x40, 0x41, 0x3F, 0x01}, // J
  {0x7F, 0x08, 0x14, 0x22, 0x41}, // K
  {0x7F, 0x40, 0x40, 0x40, 0x40}, // L
  {0x7F, 0x02, 0x0C, 0x02, 0x7F}, // M
  {0x7F, 0x04, 0x08, 0x10, 0x7F}, // N
  {0x3E, 0x41, 0x41, 0x41, 0x3E}, // O
  {0x7F, 0x09, 0x09, 0x09, 0x06}, // P
  {0x3E, 0x41, 0x51, 0x21, 0x5E}, // Q
  {0x7F, 0x09, 0x19, 0x29, 0x46}, // R
  {0x46, 0x49, 0x49, 0x49, 0x31}, // S
  {0x01, 0x01, 0x7F, 0x01, 0x01}, // T
  {0x3F, 0x40, 0x40, 0x40, 0x3F}, // U
  {0x1F, 0x20, 0x40, 0x20, 0x1F}, // V
  {0x3F, 0x40, 0x38, 0x40, 0x3F}, // W
  {0x63, 0x14, 0x08, 0x14, 0x63}, // X
  {0x07, 0x08, 0x70, 0x08, 0x07}, // Y
  {0x61, 0x51, 0x49, 0x45, 0x43}, // Z
  {0x00, 0x00, 0x00, 0x00, 0x00}, // space
};

int charToIndex(char ch) {
  if (ch >= '0' && ch <= '9') return ch - '0';
  if (ch == ':') return 10;
  if (ch >= 'A' && ch <= 'Z') return 11 + (ch - 'A');
  if (ch >= 'a' && ch <= 'z') return 11 + (ch - 'a');
  if (ch == ' ') return 37;
  return -1;
}

void drawChar(int charIndex, int topRow, int leftCol) {
  for (int col = 0; col < 5; col++) {
    uint8_t colBits = font5x7[charIndex][col];
    for (int row = 0; row < 7; row++) {
      int r = topRow + row;
      int c = leftCol + col;
      if (r >= 0 && r < DISPLAY_ROWS && c >= 0 && c < DISPLAY_COLS)
        framebuffer[r][c] = (colBits >> row) & 0x01;
    }
  }
}

void drawCharBig(int charIndex, int topRow, int leftCol) {
  for (int col = 0; col < 5; col++) {
    uint8_t colBits = font5x7[charIndex][col];
    for (int row = 0; row < 7; row++) {
      bool on = (colBits >> row) & 0x01;
      for (int dr = 0; dr < 2; dr++)
        for (int dc = 0; dc < 2; dc++) {
          int r = topRow + row * 2 + dr;
          int c = leftCol + col * 2 + dc;
          if (r >= 0 && r < DISPLAY_ROWS && c >= 0 && c < DISPLAY_COLS)
            framebuffer[r][c] = on;
        }
    }
  }
}

void drawText(const char *text, int topRow, int leftCol) {
  int x = leftCol;
  for (int i = 0; text[i] != '\0'; i++) {
    int idx = charToIndex(text[i]);
    if (idx >= 0) { drawChar(idx, topRow, x); x += 6; }
    else x += 3;
  }
}

void drawTextBig(const char *text, int topRow, int leftCol) {
  int x = leftCol;
  for (int i = 0; text[i] != '\0'; i++) {
    int idx = charToIndex(text[i]);
    if (idx >= 0) { drawCharBig(idx, topRow, x); x += 11; }
    else x += 4;
  }
}

int centerBig(const char *text) {
  int width = 0;
  for (int i = 0; text[i] != '\0'; i++) {
    int idx = charToIndex(text[i]);
    width += (idx >= 0) ? 11 : 4;
  }
  if (width > 0) width -= 1;
  return (DISPLAY_COLS - width) / 2;
}

int centerSmall(const char *text) {
  int width = 0;
  for (int i = 0; text[i] != '\0'; i++) {
    int idx = charToIndex(text[i]);
    width += (idx >= 0) ? 6 : 3;
  }
  if (width > 0) width -= 1;
  return (DISPLAY_COLS - width) / 2;
}

void clearBand(int rowOffset) {
  for (int r = rowOffset; r < rowOffset + PANEL_ROWS; r++)
    for (int c = 0; c < DISPLAY_COLS; c++)
      framebuffer[r][c] = 0;
}

void drawTextAuto(const char *text, int bandTop) {
  int bigWidth = 0;
  for (int i = 0; text[i] != '\0'; i++) {
    int idx = charToIndex(text[i]);
    bigWidth += (idx >= 0) ? 11 : 4;
  }
  if (bigWidth > 0) bigWidth -= 1;

  if (bigWidth <= DISPLAY_COLS) {
    // Big glyph is 14 rows tall; center in the 16-row band -> offset 1
    int x = centerBig(text);
    drawTextBig(text, bandTop + 1, x);
  } else {
    // Small glyph is 7 rows tall; center in the 16-row band -> offset 4
    int x = centerSmall(text);
    drawText(text, bandTop + 4, x);
  }
}