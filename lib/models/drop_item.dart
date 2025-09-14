class DropItem {
  final String id;
  final String name;
  final int price;
  final int stock;
  final int maxStock;
  final String icon;
  final String type;
  final int? pointsValue;
  final bool isRare;

  DropItem({
    required this.id,
    required this.name,
    required this.price,
    required this.stock,
    required this.maxStock,
    required this.icon,
    required this.type,
    this.pointsValue,
    this.isRare = false,
  });

  factory DropItem.fromMap(Map<String, Object> map) {
    return DropItem(
      id: map["id"] as String,
      name: map["name"] as String,
      price: map["price"] as int,
      stock: map["stock"] as int,
      maxStock: map["maxStock"] as int,
      icon: map["icon"] as String,
      type: map["type"] as String,
      pointsValue: map["pointsValue"] as int?,
      isRare: map["isRare"] as bool? ?? false,
    );
  }
}
