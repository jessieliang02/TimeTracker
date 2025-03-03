import React from 'react';
import { createRoot } from 'react-dom/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StorageManager } from '@/utils/storage';
import { DailyStats } from '@/types';
import { Settings } from '@/components/Settings';
import './styles.css';

const storage = StorageManager.getInstance();

interface StatsData {
    name: string;
    time: number;
}

function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function PopupApp() {
    const [activeTab, setActiveTab] = React.useState('today');
    const [stats, setStats] = React.useState<DailyStats | null>(null);
    const [chartData, setChartData] = React.useState<StatsData[]>([]);

    React.useEffect(() => {
        const loadStats = async () => {
            const today = new Date().toISOString().split('T')[0];
            const dailyStats = await storage.getDailyStats(today);
            setStats(dailyStats);

            if (dailyStats) {
                const data: StatsData[] = Object.entries(dailyStats.categories).map(([name, data]) => ({
                    name,
                    time: Math.round(data.totalTime / 60000) // Convert ms to minutes
                }));
                setChartData(data);
            }
        };

        loadStats();
    }, []);

    return (
        <div className="w-[400px] h-[500px] p-4 bg-background text-foreground">
            <h1 className="text-2xl font-bold mb-4">Tab Time Tracker</h1>
            
            <Tabs defaultValue="today" className="w-full">
                <TabsList className="flex mb-4 space-x-2">
                    <TabsTrigger 
                        value="today"
                        className="px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Today
                    </TabsTrigger>
                    <TabsTrigger 
                        value="stats"
                        className="px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Statistics
                    </TabsTrigger>
                    <TabsTrigger 
                        value="settings"
                        className="px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="h-[400px]">
                    {stats ? (
                        <>
                            <div className="mb-4">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(value) => `${Math.round(value)}m`} />
                                        <Tooltip 
                                            formatter={(value: number) => formatTime(value)}
                                            labelStyle={{ color: 'black' }}
                                        />
                                        <Bar dataKey="time" fill="hsl(var(--primary))" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                {chartData.map((item) => (
                                    <div key={item.name} className="flex justify-between items-center">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-muted-foreground">{formatTime(item.time)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No data available for today</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="stats">
                    <p className="text-muted-foreground">Statistics view coming soon...</p>
                </TabsContent>

                <TabsContent value="settings">
                    <Settings />
                </TabsContent>
            </Tabs>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<PopupApp />);
} 