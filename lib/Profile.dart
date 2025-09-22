import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qafela/Settings.dart';
import 'package:qafela/splash.dart';
import 'package:qafela/widgets/EditProfilePage.dart';
import 'package:qafela/widgets/wallet_service.dart';
import 'package:provider/provider.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage>
    with SingleTickerProviderStateMixin {
  String avatarUrl = "https://i.pravatar.cc/150?img=3";
  final ImagePicker _picker = ImagePicker();

  final Map<String, dynamic> user = {
    "username": "محمد جابر",
    "id": "USR-0001",
    "email": "mohamed@example.com",
    "country": "🇸🇦 السعودية",

    "lastDrop": "Drop #23 - 12/9/2025",
    "badges": ["🏆", "🥇", "🎖️"],
    "leaderboardRank": 86
  };

  late ScrollController _scrollController;
  double _scrollOffset = 0.0;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()
      ..addListener(() {
        setState(() {
          _scrollOffset = _scrollController.offset;
        });
      });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _showAvatarOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.visibility),
              title: const Text('عرض الصورة'),
              onTap: () {
                Navigator.pop(context);
                _showFullImage();
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo),
              title: const Text('تغيير الصورة'),
              onTap: () async {
                Navigator.pop(context);
                final XFile? image =
                await _picker.pickImage(source: ImageSource.gallery);
                if (image != null) {
                  setState(() {
                    avatarUrl = image.path;
                  });
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete),
              title: const Text('إزالة الصورة'),
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  avatarUrl = "https://i.pravatar.cc/150?img=1";
                });
              },
            ),
            ListTile(
              leading: const Icon(Icons.close),
              title: const Text('إلغاء'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  void _showFullImage() {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: InteractiveViewer(
            child: avatarUrl.startsWith('http')
                ? Image.network(avatarUrl)
                : Image.file(File(avatarUrl)),
          ),
        ),
      ),
    );
  }

  Widget _animatedStat(String label, num value, IconData icon) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value.toDouble()),
      duration: const Duration(seconds: 1),
      builder: (context, val, child) => _buildStatCard(label,
          val.toStringAsFixed(2), icon),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: CustomScrollView(
          controller: _scrollController,
          slivers: [
            SliverAppBar(
              expandedHeight: 200,
              pinned: true,
              backgroundColor: const Color(0xFFF9D29D),
              flexibleSpace: FlexibleSpaceBar(
                centerTitle: true,
                title: Text(user["username"],
                    style: const TextStyle(
                        color: Colors.brown,
                        fontSize: 18,
                        fontWeight: FontWeight.bold)),
                background: Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFFBE6C2), Color(0xFFF9D29D)],
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: _showAvatarOptions,
                      child: CircleAvatar(
                        radius: 50,
                        backgroundImage: avatarUrl.startsWith('http')
                            ? NetworkImage(avatarUrl)
                            : FileImage(File(avatarUrl)) as ImageProvider,
                        child: Align(
                          alignment: Alignment.bottomRight,
                          child: Container(
                            decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white),
                            padding: const EdgeInsets.all(4),
                            child: const Icon(Icons.edit, size: 16),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(user["country"],
                        style: const TextStyle(color: Colors.brown)),
                    const SizedBox(height: 4),
                    Text("ID: ${user["id"]}",
                        style: const TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                            fontStyle: FontStyle.italic)),
                    const SizedBox(height: 16),

                    // Badges
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: user["badges"].map<Widget>((b) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: Text(b, style: const TextStyle(fontSize: 24)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),

                    // Stats
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Consumer<WalletService>(
                          builder: (context, wallet, child) {
                            return Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                _animatedStat(
                                  "الرصيد",
                                  wallet.balance,
                                  Icons.account_balance_wallet,
                                ),
                                _animatedStat(
                                  "النقاط",
                                  wallet.points.toDouble(),
                                  Icons.star,
                                ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),


                    const SizedBox(height: 20),

                    // Last Drop
                    _infoCard("آخر Drop", user["lastDrop"], Icons.local_fire_department),
                    const SizedBox(height: 20),

                    // Leaderboard مختصر
                    _infoCard("ترتيبك الحالي", "رقم ${user["leaderboardRank"]}", Icons.emoji_events),
                    const SizedBox(height: 20),

                    // Buttons
                    _AnimatedButton(Icons.edit, "تعديل البيانات", () async {
                      final updatedUser = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => EditProfilePage(user: user),
                        ),
                      );

                      if (updatedUser != null) {
                        setState(() {
                          user.addAll(updatedUser);
                        });
                      }
                    }),

                    _AnimatedButton(Icons.settings, "الإعدادات", () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SettingsScreen()),
                      );
                    }),

                    _AnimatedButton(Icons.logout, "تسجيل الخروج", () {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (_) => const SplashScreen()),
                      );
                    }),


                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 3,
      child: Container(
        padding: const EdgeInsets.all(16),
        width: 140,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFFBE6C2), Color(0xFFF9D29D)],
          ),
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 30, color: Color(0xFF5D4037)),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF5D4037)),
            ),
            Text(title, style: const TextStyle(color: Colors.brown)),
          ],
        ),
      ),
    );
  }

  Widget _infoCard(String title, String value, IconData icon) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 3,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFFBE6C2), Color(0xFFF9D29D)],
          ),
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: Colors.white.withOpacity(0.3),
              child: Icon(icon, color: Color(0xFF5D4037)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(color: Colors.brown, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(value,
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF5D4037))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _AnimatedButton(IconData icon, String title, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: onTap,
          icon: Icon(icon, color: Colors.white),
          label: Text(title),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFF9D29D),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
      ),
    );
  }
}
