import { useState } from "react";
import { useGetMe, useAdminGetStats, useAdminListUsers, useAdminListGenerations, useAdminAdjustCredits, useAdminUpdateRole } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListUsersQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";

export default function Admin() {
  const { data: me, isLoading: meLoading } = useGetMe();

  if (meLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (me?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and user management.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 bg-secondary/50 p-1 w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 sm:flex-none">Users</TabsTrigger>
          <TabsTrigger value="generations" className="flex-1 sm:flex-none">Generations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <AdminOverview />
        </TabsContent>
        
        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="generations">
          <AdminGenerations />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminOverview() {
  const { data: stats, isLoading } = useAdminGetStats();

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin mx-auto my-12 text-primary" />;

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats?.totalUsers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Generations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono text-primary">{stats?.totalGenerations}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Credits Issued</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats?.creditsIssued || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Quiz Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{Object.values(stats?.quizStats || {}).reduce((a, b) => a + b, 0)}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminListUsers({ query: { search } });
  const adjustCredits = useAdminAdjustCredits();
  const updateRole = useAdminUpdateRole();
  const queryClient = useQueryClient();

  const handleAdjustCredits = (userId: number, amount: number) => {
    adjustCredits.mutate(
      { id: userId, data: { amount } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() }) }
    );
  };

  const handleToggleRole = (userId: number, currentRole: string) => {
    updateRole.mutate(
      { id: userId, data: { role: currentRole === 'admin' ? 'user' : 'admin' } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() }) }
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>User Management</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search email..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Credits</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.users.map((user) => (
                  <tr key={user.id} className="bg-card">
                    <td className="p-3">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.name || "No name"}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                    </td>
                    <td className="p-3 font-mono">{user.credits}</td>
                    <td className="p-3 capitalize">{user.currentPlan || "None"}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleAdjustCredits(user.id, 100)}>+100 C</Button>
                        <Button size="sm" variant="outline" onClick={() => handleToggleRole(user.id, user.role)}>Toggle Role</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminGenerations() {
  const { data: generations, isLoading } = useAdminListGenerations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Generations</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Tool</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Input Summary</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Tokens</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {generations?.map((gen) => (
                  <tr key={gen.id} className="bg-card">
                    <td className="p-3"><Badge variant="outline" className="capitalize text-primary border-primary/20">{gen.toolType.replace('_', ' ')}</Badge></td>
                    <td className="p-3 max-w-xs truncate">{gen.inputSummary}</td>
                    <td className="p-3 font-mono">{gen.tokensEstimate || 0}</td>
                    <td className="p-3 text-muted-foreground">{new Date(gen.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
