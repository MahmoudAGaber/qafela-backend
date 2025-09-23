import 'package:flutter/material.dart';
import 'package:qafela/theme/desert_theme.dart';
import 'package:qafela/theme/desert_dark_theme.dart';

class ThemeProvider extends ChangeNotifier {
  bool _isDark = false;

  bool get isDark => _isDark;

  ThemeData get currentTheme => _isDark ? DesertDarkTheme.theme : DesertTheme.theme;

  void toggleTheme() {
    _isDark = !_isDark;
    notifyListeners();
  }
}
