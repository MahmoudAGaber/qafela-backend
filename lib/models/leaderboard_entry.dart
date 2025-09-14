class LeaderboardEntry {
  final int rank;
  final String username;
  final int points;

  LeaderboardEntry({
    required this.rank,
    required this.username,
    required this.points,
  });

  factory LeaderboardEntry.fromMap(Map<String, Object> map) {
    return LeaderboardEntry(
      rank: map["rank"] as int,
      username: map["username"] as String,
      points: map["points"] as int,
    );
  }
}
