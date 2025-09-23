import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qafela/BarterCenter.dart';
import 'package:qafela/DropHistory.dart';
import 'package:qafela/DropScreen.dart';
import 'package:qafela/Profile.dart';
import 'package:qafela/RewardCenter.dart';
import 'package:qafela/Settings.dart';
import 'LoginChoiceScreen.dart';
import 'splash.dart';
import 'index.dart';
import 'package:qafela/Leaderboard.dart';
import 'package:qafela/Wallet.dart';
import 'package:qafela/widgets/wallet_service.dart';
import 'package:qafela/theme/theme_provider.dart';
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => WalletService()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: const MyApp(),
    ),
  );
}



class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: themeProvider.currentTheme,
      initialRoute: "/",
      routes: {
        "/": (context) => const SplashScreen(),
        "/login-choice": (context) => const LoginChoiceScreen(),
        "/home": (context) => const IndexPage(),
        "/drop": (context) => const DropScreen(),
        "/leaderboard": (context) => const LeaderboardScreen(),
        "/wallet": (context) => const WalletPage(),
        "/settings": (context) => SettingsScreen(), // هنا نقدر نحط زرار التبديل
        "/profile": (context) => ProfilePage(),
        "/barter": (context) => BarterCenter(),
        "/reward-center": (context) => RewardCenterScreen(),
        "/drop-history": (context) => DropHistoryScreen(),
      },
    );
  }
}
