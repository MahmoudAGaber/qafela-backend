import 'package:flutter/material.dart';
import 'package:qafela/BarterCenter.dart';
import 'package:qafela/DropHistory.dart';
import 'package:qafela/DropScreen.dart';
import 'package:qafela/Profile.dart';
import 'package:qafela/RewardCenter.dart';
import 'package:qafela/Settings.dart';
import 'splash.dart';
import 'index.dart';
import 'package:qafela/Leaderboard.dart';
import 'package:qafela/Wallet.dart';
import 'package:qafela/theme/desert_theme.dart.';




void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(

      debugShowCheckedModeBanner: false,
      theme:DesertTheme.theme,
      initialRoute: "/",
      routes: {
        "/": (context) => const SplashScreen(),
        "/home": (context) => const IndexPage(),
        "/drop": (context) => const DropScreen(),
        "/leaderboard": (context) => const LeaderboardScreen(),
        "/wallet": (context) => const WalletPage(),
        "/settings": (context) => const SettingsScreen(),
        "/profile": (context) => ProfilePage(),
        "/barter": (context) => BarterCenter(),
        "/reward-center": (context) => RewardCenterScreen(),
        "/drop-history": (context) =>  DropHistoryScreen(),
      },
    );
  }
}
