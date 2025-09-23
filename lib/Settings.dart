import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qafela/theme/theme_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool notificationsEnabled = true;
  bool soundsEnabled = true;
  String language = "العربية";

  final appInfo = {
    "version": "1.2.0",
    "buildNumber": "2024.01.15",
  };

  void _showAlert(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 2)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("الإعدادات"),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ===== التطبيق =====
          _buildGroup(
            "التطبيق",
            [
              ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.language, color: Colors.blue),
                ),
                title: const Text("اللغة"),
                subtitle: Text(language),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  _showAlert("سيتم فتح خيارات اللغة");
                },
              ),
              SwitchListTile(
                value: notificationsEnabled,
                onChanged: (value) {
                  setState(() => notificationsEnabled = value);
                },
                title: const Text("الإشعارات"),
                subtitle: const Text("إشعارات القوافل والجوائز"),
                secondary: const CircleAvatar(
                  child: Icon(Icons.notifications, color: Colors.orange),
                ),
              ),
              SwitchListTile(
                value: Provider.of<ThemeProvider>(context).isDark,
                onChanged: (_) => Provider.of<ThemeProvider>(context, listen: false).toggleTheme(),
                title: const Text("الوضع الليلي"),
                subtitle: const Text("تبديل بين الوضع النهاري والليلي"),
                secondary: const CircleAvatar(
                  child: Icon(Icons.nightlight_round, color: Colors.orange),
                ),
              ),

              SwitchListTile(
                value: soundsEnabled,
                onChanged: (value) {
                  setState(() => soundsEnabled = value);
                },
                title: const Text("الأصوات"),
                subtitle: const Text("أصوات التطبيق والتأثيرات"),
                secondary: const CircleAvatar(
                  child: Icon(Icons.volume_up, color: Colors.green),
                ),
              ),
            ],
          ),

          // ===== الحساب =====
          _buildGroup(
            "الحساب",
            [
              ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.security, color: Colors.red),
                ),
                title: const Text("الخصوصية والأمان"),
                subtitle: const Text("إدارة إعدادات الخصوصية"),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showAlert("سيتم فتح صفحة الخصوصية"),
              ),
              ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.notifications_active, color: Colors.purple),
                ),
                title: const Text("تفضيلات الإشعارات"),
                subtitle: const Text("تخصيص أنواع الإشعارات"),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showAlert("سيتم فتح صفحة الإشعارات"),
              ),
            ],
          ),

          // ===== المساعدة والدعم =====
          _buildGroup(
            "المساعدة والدعم",
            [
              ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.help_outline, color: Colors.teal),
                ),
                title: const Text("الأسئلة الشائعة"),
                subtitle: const Text("إجابات للأسئلة الشائعة"),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showAlert("سيتم فتح صفحة الأسئلة الشائعة"),
              ),
              ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.phone, color: Colors.blueAccent),
                ),
                title: const Text("تواصل معنا"),
                subtitle: const Text("مركز خدمة العملاء"),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showAlert("سيتم فتح صفحة التواصل"),
              ),
              ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.description, color: Colors.brown),
                ),
                title: const Text("الشروط والأحكام"),
                subtitle: const Text("قواعد استخدام التطبيق"),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showAlert("سيتم فتح صفحة الشروط"),
              ),
            ],
          ),

          // ===== معلومات التطبيق =====
          _buildGroup(
            "معلومات التطبيق",
            [
              ListTile(
                title: const Text("إصدار التطبيق"),
                trailing: Text(appInfo["version"]!),
              ),
              ListTile(
                title: const Text("رقم البناء"),
                trailing: Text(appInfo["buildNumber"]!),
              ),
            ],
          ),

          // ===== Developer Info =====
          const SizedBox(height: 16),
          Center(
            child: Column(
              children: const [
                Text("🎮", style: TextStyle(fontSize: 32)),
                SizedBox(height: 8),
                Text("صُنع بـ ❤️ لعشاق الألعاب والمكاسب"),
                Text(
                  "© 2024 قافلة الجوائز. جميع الحقوق محفوظة.",
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildGroup(String title, List<Widget> items) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          ListTile(
            title: Text(title,
                style:
                const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ),
          ...items,
        ],
      ),
    );
  }
}
