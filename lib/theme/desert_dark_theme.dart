import 'package:flutter/material.dart';

class DesertDarkTheme {
  static final ThemeData theme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: const Color(0xFF5D4037), // بني صحراوي داكن
    scaffoldBackgroundColor: const Color(0xFF3E2723), // خلفية داكنة
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF000000),
      foregroundColor: Colors.white,
      elevation: 2,
    ),
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFF5D4037),
      secondary: Color(0xFFFFA000), // لون أصفر رملي للـ accents
      background: Color(0xFF3E2723),
      surface: Color(0xFF4E342E),
      onPrimary: Colors.white,
      onSecondary: Colors.black,
      onSurface: Colors.white,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: Color(0xFFFFA000),
      foregroundColor: Colors.brown,
    ),
    buttonTheme: const ButtonThemeData(
      buttonColor: Color(0xFFFFA000),
      textTheme: ButtonTextTheme.primary,
    ),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: Colors.white),
      bodyMedium: TextStyle(color: Colors.white70),
      bodySmall: TextStyle(color: Colors.white60),
    ),
    cardTheme: CardTheme(
      color: const Color(0xFF4E342E),
      shadowColor: Colors.black54,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      filled: true,
      fillColor: Color(0xFF4E342E),
      hintStyle: TextStyle(color: Colors.white54),
      labelStyle: TextStyle(color: Colors.white70),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
        borderSide: BorderSide(color: Colors.orange),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
        borderSide: BorderSide(color: Color(0xFFFFA000)),
      ),
    ),
  );
}
