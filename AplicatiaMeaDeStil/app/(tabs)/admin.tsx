import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/constants/config';
import { router } from 'expo-router';

interface DashboardStats {
  total_users: number;
  new_users_today: number;
  new_users_week: number;
  total_outfits: number;
  liked_outfits: number;
  satisfaction_rate: number;
  outfits_today: number;
  outfits_week: number;
}

interface TopUser {
  email: string;
  outfit_count: number;
}

interface ActivityData {
  date: string;
  count: number;
}

interface StyleDist {
  casual: number;
  elegant: number;
  sport: number;
  other: number;
}

interface AIMetrics {
  statistics: {
    total_generations: number;
    successful_generations: number;
    failed_generations: number;
    success_rate: number;
    avg_processing_time: number;
  };
  style_popularity: Array<{
    style: string;
    count: number;
    percentage: number;
  }>;
  timeline: Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
  }>;
  common_errors: Array<{
    error_message: string;
    count: number;
  }>;
}

export default function AdminScreen() {
  const { isAdmin, isAuthenticated, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [styleDist, setStyleDist] = useState<StyleDist | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.replace('/(tabs)');
      return;
    }
    fetchDashboard();
  }, [isAdmin, isAuthenticated]);

  const fetchDashboard = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.status === 'success') {
        setStats(data.dashboard.stats);
        setTopUsers(data.dashboard.top_users);
        setActivityData(data.dashboard.activity_chart);
        setStyleDist(data.dashboard.style_distribution);
      } else {
        Alert.alert('Error', data.message || 'Failed to load dashboard');
      }
    } catch {
      Alert.alert('Error', 'Could not fetch dashboard data');
    }
    
    // Fetch AI metrics separately
    try {
      const aiResponse = await fetch(`${API_BASE_URL}/admin/ai-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const aiData = await aiResponse.json();

      if (aiData.status === 'success') {
        setAiMetrics(aiData.ai_metrics);
      }
    } catch (error) {
      console.error('Could not fetch AI metrics:', error);
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <View style={styles.centered}>
        <Ionicons name="shield-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Admin access required</Text>
      </View>
    );
  }

  if (loading && !stats) {
    return (
      <View style={styles.centered}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={32} color="#007AFF" />
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          title="Total Users"
          value={stats?.total_users || 0}
          subtitle={`+${stats?.new_users_week || 0} this week`}
          color="#007AFF"
        />
        <StatCard
          icon="shirt"
          title="Total Outfits"
          value={stats?.total_outfits || 0}
          subtitle={`${stats?.outfits_today || 0} today`}
          color="#34C759"
        />
        <StatCard
          icon="heart"
          title="Liked Outfits"
          value={stats?.liked_outfits || 0}
          subtitle={`${stats?.satisfaction_rate || 0}% satisfaction`}
          color="#FF3B30"
        />
        <StatCard
          icon="trending-up"
          title="Activity"
          value={stats?.outfits_week || 0}
          subtitle="outfits this week"
          color="#FF9500"
        />
      </View>

      {/* Style Distribution */}
      {styleDist && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style Distribution</Text>
          <View style={styles.card}>
            <StyleBar label="Casual" count={styleDist.casual} color="#007AFF" />
            <StyleBar label="Elegant" count={styleDist.elegant} color="#5856D6" />
            <StyleBar label="Sport" count={styleDist.sport} color="#34C759" />
            <StyleBar label="Other" count={styleDist.other} color="#8E8E93" />
          </View>
        </View>
      )}

      {/* Top Users */}
      {topUsers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Active Users</Text>
          <View style={styles.card}>
            {topUsers.map((user, index) => (
              <View key={user.email} style={styles.userRow}>
                <View style={styles.userRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                <Text style={styles.userCount}>{user.outfit_count} outfits</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Activity Chart (Simple) */}
      {activityData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity (7 Days)</Text>
          <View style={styles.card}>
            {activityData.map((item) => (
              <View key={item.date} style={styles.activityRow}>
                <Text style={styles.activityDate}>
                  {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <View style={styles.activityBarContainer}>
                  <View 
                    style={[
                      styles.activityBar, 
                      { width: `${Math.min((item.count / Math.max(...activityData.map(d => d.count))) * 100, 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.activityCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* AI Metrics Section */}
      {aiMetrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="analytics" size={20} color="#007AFF" /> AI Generation Metrics
            </Text>
            
            {/* AI Statistics Cards */}
            <View style={styles.aiStatsRow}>
              <View style={[styles.miniCard, { borderLeftColor: '#34C759' }]}>
                <Text style={styles.miniCardValue}>{aiMetrics.statistics.total_generations}</Text>
                <Text style={styles.miniCardLabel}>Total Generations</Text>
              </View>
              <View style={[styles.miniCard, { borderLeftColor: '#007AFF' }]}>
                <Text style={styles.miniCardValue}>{aiMetrics.statistics.success_rate}%</Text>
                <Text style={styles.miniCardLabel}>Success Rate</Text>
              </View>
              <View style={[styles.miniCard, { borderLeftColor: '#FF9500' }]}>
                <Text style={styles.miniCardValue}>{aiMetrics.statistics.avg_processing_time.toFixed(2)}s</Text>
                <Text style={styles.miniCardLabel}>Avg Time</Text>
              </View>
            </View>

            {/* Style Popularity */}
            {aiMetrics.style_popularity.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardSubtitle}>Style Popularity</Text>
                {aiMetrics.style_popularity.map((item) => (
                  <View key={item.style} style={styles.popularityRow}>
                    <Text style={styles.popularityStyle}>{item.style}</Text>
                    <View style={styles.popularityBarContainer}>
                      <View 
                        style={[
                          styles.popularityBar, 
                          { width: `${item.percentage}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.popularityPercentage}>{item.percentage}%</Text>
                    <Text style={styles.popularityCount}>({item.count})</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Generation Timeline */}
            {aiMetrics.timeline.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardSubtitle}>Generation Timeline (7 Days)</Text>
                {aiMetrics.timeline.map((item) => (
                  <View key={item.date} style={styles.timelineRow}>
                    <Text style={styles.timelineDate}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.timelineStats}>
                      <View style={styles.timelineStat}>
                        <View style={[styles.timelineDot, { backgroundColor: '#34C759' }]} />
                        <Text style={styles.timelineNumber}>{item.successful}</Text>
                      </View>
                      <View style={styles.timelineStat}>
                        <View style={[styles.timelineDot, { backgroundColor: '#FF3B30' }]} />
                        <Text style={styles.timelineNumber}>{item.failed}</Text>
                      </View>
                    </View>
                    <Text style={styles.timelineTotal}>{item.total} total</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Common Errors */}
            {aiMetrics.common_errors.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardSubtitle}>Common Errors</Text>
                {aiMetrics.common_errors.map((item) => (
                  <View key={item.error_message} style={styles.errorRow}>
                    <Ionicons name="warning" size={16} color="#FF3B30" />
                    <Text style={styles.errorMessage} numberOfLines={2}>{item.error_message}</Text>
                    <Text style={styles.errorCount}>×{item.count}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const StatCard = ({ icon, title, value, subtitle, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statSubtitle}>{subtitle}</Text>
  </View>
);

const StyleBar = ({ label, count, color }: any) => {
  const maxCount = 100; // Adjust based on your data
  const percentage = Math.min((count / maxCount) * 100, 100);

  return (
    <View style={styles.styleBarContainer}>
      <Text style={styles.styleLabel}>{label}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.styleCount}>{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  styleBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  styleLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: '500',
  },
  barBackground: {
    flex: 1,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 12,
  },
  styleCount: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  userRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#115740', // Gucci Green
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userEmail: {
    flex: 1,
    fontSize: 14,
  },
  userCount: {
    fontSize: 12,
    color: '#666',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  activityDate: {
    width: 80,
    fontSize: 12,
    color: '#666',
  },
  activityBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  activityBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  activityCount: {
    width: 30,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  aiStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  miniCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  miniCardLabel: {
    fontSize: 11,
    color: '#666',
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  popularityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  popularityStyle: {
    width: 70,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  popularityBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  popularityBar: {
    height: '100%',
    backgroundColor: '#115740', // Gucci Green
    borderRadius: 10,
  },
  popularityPercentage: {
    width: 45,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  popularityCount: {
    width: 40,
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 12,
  },
  timelineDate: {
    width: 60,
    fontSize: 12,
    color: '#666',
  },
  timelineStats: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  timelineStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineNumber: {
    fontSize: 13,
    fontWeight: '500',
  },
  timelineTotal: {
    width: 60,
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 8,
  },
  errorMessage: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  errorCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
