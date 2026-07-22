#pragma once
#include <Arduino.h>

int charToIndex(char ch);
void drawChar(int charIndex, int topRow, int leftCol);
void drawCharBig(int charIndex, int topRow, int leftCol);
void drawText(const char *text, int topRow, int leftCol);
void drawTextBig(const char *text, int topRow, int leftCol);
int centerBig(const char *text);
int centerSmall(const char *text);
void clearBand(int rowOffset);

// Auto-picks big or small font based on whether it fits, and
// vertically centers within a 16-row band starting at bandTop.
void drawTextAuto(const char *text, int bandTop);