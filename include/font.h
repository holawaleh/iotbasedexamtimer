#pragma once
#include <Arduino.h>

int charToIndex(char ch);
void drawChar(int charIndex, int topRow, int leftCol);
void drawCharBig(int charIndex, int topRow, int leftCol);
void drawCharMed(int charIndex, int topRow, int leftCol);
void drawText(const char *text, int topRow, int leftCol);
void drawTextBig(const char *text, int topRow, int leftCol);
void drawTextMed(const char *text, int topRow, int leftCol);
void drawTextAuto(const char *text, int bandBaseRow);
void drawTextScroll(const char *text, int bandBaseRow, int offset);
int textWidthSmall(const char *text);
int centerBig(const char *text);
int centerMed(const char *text);
int centerSmall(const char *text);
void clearBand(int rowOffset);