scanner 代码

```cpp
%option noinput
%option nounput
%option noyywrap
%option yylineno
%{
    #include "calc.hh"
%}

Digit [0-9]
Blank [ \t\n]
Identifier [_a-zA-Z][_a-zA-Z0-9]*
%%
"print"                     {return PRINT;}

"("                         {return LPAREN;}
")"                         {return RPAREN;}
","                         {return COMMA;}
";"                         {return SEMICOLON;}
"+"                         {return PLUS;}
"-"                         {return MINUS;}
"*"                         {return TIMES;}
"/"                         {return DIVIDE;}
"="                         {return ASSIGN;}

{Blank}                     { /* No action required */ }
{Digit}*"."*{Digit}*        {tokval.type_int = atoi(yytext); return NUM;}
{Identifier}                {strcpy(tokval.type_string, yytext); return IDENT;}
<<EOF>>                     {return END;}
.               {
                    printf("Error occurs at line %d near '%s'\n", yylineno, yytext);
                }
%%

```

```cpp
%option noinput
%option nounput
%option noyywrap
%option yylineno
%{
    #include "calc.hh"
%}

Digit [0-9]
Blank [ \t\n]
Identifier [_a-zA-Z][_a-zA-Z0-9]*
%%
"print"                     {return PRINT;}

"("                         {return LPAREN;}
")"                         {return RPAREN;}
","                         {return COMMA;}
";"                         {return SEMICOLON;}
"+"                         {return PLUS;}
"-"                         {return MINUS;}
"*"                         {return TIMES;}
"/"                         {return DIVIDE;}
"="                         {return ASSIGN;}

{Blank}                     { /* No action required */ }
{Digit}*"."*{Digit}*        {tokval.type_int = atoi(yytext); return NUM;}
{Identifier}                {strcpy(tokval.type_string, yytext); return IDENT;}
<<EOF>>                     {return END;}
.               {
                    printf("Error occurs at line %d near '%s'\n", yylineno, yytext);
                }
%%

```

递归下降代码

```cpp
#include "calc.hh"
#include <cstdio>
#include <iostream>
#include <string>
#include <unordered_map>

using namespace std;

extern int yylex();
string input;

void S(), S_(), L();

int E(), E_(), B(int a);

unordered_map<string, int> sym_table;

tokenval tokval;
int tok;
int lookahead = yylex();

int getToken() {
  int token = lookahead;
  lookahead = yylex();
  return token;
}

void advance() { tok = getToken(); }

void print_tok() {
  cout << "token: " << tok << endl;
  cout << "tokval.type_int: " << tokval.type_int << endl;
  cout << "tokval.type_string: " << tokval.type_string << endl;
}

void S() {
  advance();
  // printf("S() %d\n", tok);
  switch (tok) {
  case IDENT: {
    string id = tokval.type_string;
    if (lookahead == ASSIGN) {
      advance();
      sym_table[id] = E();
      S_();
    }
    break;
  }
  case PRINT: {
    // printf("print %d\n", tok);
    if (lookahead == LPAREN) {
      advance();
      L();
      advance();
      if (tok == RPAREN) {
        S_();
      } else {
        cout << "Expected ) \n";
      }
    }
    break;
  }
  default: {
    cout << "Expected id or print() \n";
  }
  }
}

void S_() {
  advance();
  // printf("S_() %d\n", tok);
  switch (tok) {
  case SEMICOLON: {
    S();
    break;
  }
  default: {
    cout << "Expected ; \n";
    break;
  }
  }
}

void L() {
  // printf("L() %d\n", lookahead);
  switch (lookahead) {
  case IDENT:
  case NUM: {
    printf("%d\n", E());
    break;
  }
  default: {
    cout << "Expected id or num \n";
  }
  }
}

int E() {
  advance();
  // printf("E() %d\n", tok);
  switch (tok) {
  case IDENT: {
    int i = sym_table[tokval.type_string];
    // cout << "i: " << i << "\n";
    int p = lookahead;
    if (p == PLUS || p == MINUS || p == TIMES || p == DIVIDE) {
      return B(i);
    }
    return i;
  }
  case NUM: {
    int i = tokval.type_int;
    int p = lookahead;
    if (p == PLUS || p == MINUS || p == TIMES || p == DIVIDE) {
      return B(i);
    }
    return i;
  }
  case LPAREN: {
    int i = E();
    if (lookahead == RPAREN) {
      return i;
    } else {
      return 0;
    }
  }
  default: {
    cout << "Expected id, num or ( \n";
    return 0;
  }
  }
}

int B(int a) {
  advance();
  // printf("B(int a) %d\n", tok);
  switch (tok) {
  case PLUS: {
    return a + E();
  }
  case MINUS: {
    return a - E();
  }
  case TIMES: {
    return a * E();
  }
  case DIVIDE: {
    return a / E();
  }
  default: {
    return 0;
  }
  }
}

int main() {
  S();
  return 0;
}
```
