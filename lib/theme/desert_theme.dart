import 'package:flutter/material.dart';

class DesertTheme {
  static const Color sandGold = Color(0xFFd4a373);
  static const Color desertSand = Color(0xFFfefae0);
  static const Color dateBrown = Color(0xFF7f5539);
  static const Color palmGreen = Color(0xFF606c38);
  static const Color oliveBlack = Color(0xFF283618);

  static ThemeData get theme {
    return ThemeData(
      primaryColor: sandGold,
      scaffoldBackgroundColor: desertSand,
      appBarTheme: const AppBarTheme(
        backgroundColor: dateBrown,
        foregroundColor: Colors.white,
      ),
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: oliveBlack, fontSize: 18),
        bodyMedium: TextStyle(color: palmGreen, fontSize: 16),
        titleLarge: TextStyle(
          color: dateBrown,
          fontWeight: FontWeight.bold,
          fontSize: 20,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: sandGold,
          foregroundColor: Colors.white,
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(12)),
          ),
        ),
      ),
      cardTheme: const CardTheme(
        color: desertSand,
        shadowColor: Colors.black26,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
    );
  }
}
