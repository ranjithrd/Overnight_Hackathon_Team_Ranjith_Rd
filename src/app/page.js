// src/app/page.js
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, Wallet, ArrowUpRight, ArrowDownLeft, Filter } from "lucide-react"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Dashboard() {
  return (
    <div className="space-y-8 p-4 md:p-8 bg-[#F4F7FE] min-h-screen">
      
      {/* 1. HEADER: Cleaner, more whitespace, specific Horizon font colors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">Hi, Welcome back!</h2>
          <h1 className="text-3xl font-bold text-[#1B254B] tracking-tight">Dashboard</h1>
        </div>
        
        {/* Search Bar "Pill" Style */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-full shadow-sm">
          <div className="relative bg-[#F4F7FE] rounded-full px-4 py-2 flex items-center">
             <Search className="h-4 w-4 text-gray-400 mr-2" />
             <input 
                className="bg-transparent border-none text-sm outline-none w-48 text-[#1B254B] placeholder-gray-400" 
                placeholder="Search..." 
             />
          </div>
          <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:text-[#1B254B]">
            <Bell className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CM</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* 2. KPI CARDS: The "Horizon" Look 
          - No borders (border-none)
          - rounded-[20px] for soft corners
          - Specific colorful icon bubbles
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Assets */}
        <Card className="rounded-[20px] border-none shadow-[0px_3px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            {/* Icon Bubble */}
            <div className="h-14 w-14 bg-blue-50 rounded-full flex items-center justify-center">
                <Wallet className="h-7 w-7 text-blue-600" />
            </div>
            <div>
                <CardTitle className="text-sm font-medium text-gray-400">Total Assets</CardTitle>
                <div className="text-3xl font-bold text-[#1B254B]">$5,250,000</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-2">
               <span className="flex items-center text-green-500 font-bold text-sm">
                  +12.5% <ArrowUpRight className="h-4 w-4 ml-1"/>
               </span>
               <span className="text-gray-400 text-sm">since last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Loans Provided */}
        <Card className="rounded-[20px] border-none shadow-[0px_3px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-14 w-14 bg-purple-50 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-7 w-7 text-purple-600" />
            </div>
            <div>
                <CardTitle className="text-sm font-medium text-gray-400">Loans Provided</CardTitle>
                <div className="text-3xl font-bold text-[#1B254B]">$3,100,000</div>
            </div>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2 mt-2">
               <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none px-3">
                  125 Active
               </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Interest Earned */}
        <Card className="rounded-[20px] border-none shadow-[0px_3px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center">
                <ArrowDownLeft className="h-7 w-7 text-green-600" />
            </div>
            <div>
                <CardTitle className="text-sm font-medium text-gray-400">Interest Earned</CardTitle>
                <div className="text-3xl font-bold text-[#1B254B]">$450,000</div>
            </div>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2 mt-2">
               <span className="flex items-center text-green-500 font-bold text-sm">
                  +2.4% <ArrowUpRight className="h-4 w-4 ml-1"/>
               </span>
               <span className="text-gray-400 text-sm">Year to Date</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. TABLE SECTION: Clean headers and soft badges */}
      <Card className="rounded-[20px] border-none shadow-[0px_3px_20px_rgba(0,0,0,0.04)]">
        <CardHeader className="flex flex-row items-center justify-between px-6 pt-6">
          <CardTitle className="text-xl font-bold text-[#1B254B]">Pending Loan Approvals</CardTitle>
          <Button variant="outline" size="sm" className="rounded-xl border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 gap-2">
             <Filter className="h-4 w-4" /> Filter
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-gray-100">
                <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider pl-4">Borrower</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Purpose</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right text-gray-400 font-medium text-xs uppercase tracking-wider pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              
              {/* Row 1 */}
              <TableRow className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors h-16">
                <TableCell className="font-bold text-[#1B254B] pl-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 bg-blue-100 text-blue-700">
                            <AvatarFallback className="font-bold">AS</AvatarFallback>
                        </Avatar>
                        Alice Smith
                    </div>
                </TableCell>
                <TableCell className="font-bold text-[#1B254B]">$15,000</TableCell>
                <TableCell className="text-gray-500 font-medium">Small Business</TableCell>
                <TableCell className="text-gray-500 font-medium">Oct 25, 2023</TableCell>
                <TableCell>
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none shadow-none font-bold">
                        Pending
                    </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2 pr-4">
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all">Approve</Button>
                    <Button size="sm" variant="destructive" className="rounded-lg shadow-md hover:shadow-lg transition-all">Disapprove</Button>
                </TableCell>
              </TableRow>

              {/* Row 2 */}
              <TableRow className="hover:bg-gray-50/50 border-none h-16">
                <TableCell className="font-bold text-[#1B254B] pl-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 bg-purple-100 text-purple-700">
                            <AvatarFallback className="font-bold">AR</AvatarFallback>
                        </Avatar>
                        Andrew Robot
                    </div>
                </TableCell>
                <TableCell className="font-bold text-[#1B254B]">$10,000</TableCell>
                <TableCell className="text-gray-500 font-medium">Equipment</TableCell>
                <TableCell className="text-gray-500 font-medium">Oct 26, 2023</TableCell>
                <TableCell>
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none shadow-none font-bold">
                        Pending
                    </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2 pr-4">
                     <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all">Approve</Button>
                     <Button size="sm" variant="destructive" className="rounded-lg shadow-md hover:shadow-lg transition-all">Disapprove</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}