import React, { useState } from 'react';
import { KeyRound, Search, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export default function KeywordsSection({ topKeywords, periodName }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!topKeywords || topKeywords.length === 0) return null;

  const filtered = topKeywords.filter((k) =>
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="border border-slate-200/80 bg-white/50 backdrop-blur-xs shadow-xs mb-6">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Top Performing Search Queries
            </CardTitle>
            <p className="text-xs text-slate-500">Live ranking data from Google Search Console</p>
          </div>
        </div>

        {/* Keyword search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Filter queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 bg-white"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Query / Keyword</TableHead>
              <TableHead className="w-28 text-center">Position</TableHead>
              <TableHead className="w-28 text-center">Clicks</TableHead>
              <TableHead className="w-28 text-center">Impressions</TableHead>
              <TableHead className="w-24 text-center">CTR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item, idx) => {
              const isTop5 = item.ranking <= 5;
              const isTop10 = item.ranking <= 10;

              return (
                <TableRow key={idx} className={isTop5 ? 'bg-amber-50/20' : ''}>
                  <TableCell className="text-center font-medium">
                    <Badge
                      variant={isTop5 ? 'warning' : isTop10 ? 'info' : 'secondary'}
                      className="text-[11px] px-1.5"
                    >
                      #{idx + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{item.keyword}</span>
                      {isTop5 && <Award className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-700">
                    {item.ranking}
                  </TableCell>
                  <TableCell className="text-center text-slate-700">
                    {item.clicks !== undefined ? item.clicks.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell className="text-center text-slate-700">
                    {item.impressions !== undefined ? item.impressions.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell className="text-center text-slate-700">
                    {item.ctr || '-'}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No matching queries found for "{searchTerm}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
