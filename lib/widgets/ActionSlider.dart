import 'package:flutter/material.dart';

class ActionSlider extends StatelessWidget {
  final List<_NavCardData> items = [
    _NavCardData(icon: "🐪", label: "دخول القافلة", route: "/drop"),
    _NavCardData(icon: "🏆", label: "الترتيب", route: "/leaderboard"),
    _NavCardData(icon: "⛺", label: "الخيمة", route: "/profile"),
    _NavCardData(icon: "💼", label: "المحفظة", route: "/wallet"),
    _NavCardData(icon: "🏺", label: "مركز المقايضات", route: "/barter"),
    _NavCardData(icon: "🎁", label: "مركز الجوائز", route: "/reward-center"),
    _NavCardData(icon: "📜", label: "سجل القوافل", route: "/drop-history"),
    _NavCardData(icon: "⚙️", label: "الإعدادات", route: "/settings"),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 140, // ارتفاع موحد للمربعات
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final item = items[index];
          return _NavCard(
            icon: item.icon,
            label: item.label,
            route: item.route,
          );
        },
      ),
    );
  }
}

class _NavCardData {
  final String icon;
  final String label;
  final String route;
  const _NavCardData({required this.icon, required this.label, required this.route});
}

class _NavCard extends StatelessWidget {
  final String icon;
  final String label;
  final String route;

  const _NavCard({required this.icon, required this.label, required this.route});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, route),
      child: Container(
        width: 120, // ✅ نفس العرض لكل المربعات
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
