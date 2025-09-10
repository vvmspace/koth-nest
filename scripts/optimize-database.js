#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Конфигурация базы данных
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'koth',
  user: 'koth',
  password: 'koth123'
};

class DatabaseOptimizer {
  constructor() {
    this.client = new Client(DB_CONFIG);
    this.optimizationResults = [];
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to PostgreSQL database');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('✅ Disconnected from database');
  }

  async analyzeTable(tableName) {
    console.log(`\n📊 Analyzing table: ${tableName}`);
    
    try {
      // Получаем информацию о таблице
      const tableInfo = await this.client.query(`
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          atttypid::regtype as data_type,
          attnotnull as not_null,
          attnum as column_number
        FROM pg_attribute 
        JOIN pg_class ON pg_attribute.attrelid = pg_class.oid 
        JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
        WHERE pg_class.relname = $1 
        AND pg_attribute.attnum > 0 
        AND NOT pg_attribute.attisdropped
        ORDER BY pg_attribute.attnum
      `, [tableName]);

      // Получаем статистику таблицы
      const tableStats = await this.client.query(`
        SELECT 
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables 
        WHERE relname = $1
      `, [tableName]);

      // Получаем информацию об индексах
      const indexInfo = await this.client.query(`
        SELECT 
          indexname,
          indexdef,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        WHERE relname = $1
        ORDER BY idx_scan DESC
      `, [tableName]);

      // Получаем размер таблицы
      const sizeInfo = await this.client.query(`
        SELECT 
          pg_size_pretty(pg_total_relation_size($1)) as total_size,
          pg_size_pretty(pg_relation_size($1)) as table_size,
          pg_size_pretty(pg_total_relation_size($1) - pg_relation_size($1)) as index_size
      `, [tableName]);

      const analysis = {
        tableName,
        columns: tableInfo.rows,
        stats: tableStats.rows[0] || {},
        indexes: indexInfo.rows,
        size: sizeInfo.rows[0] || {}
      };

      console.log(`  📋 Columns: ${analysis.columns.length}`);
      console.log(`  📊 Live tuples: ${analysis.stats.live_tuples || 0}`);
      console.log(`  💀 Dead tuples: ${analysis.stats.dead_tuples || 0}`);
      console.log(`  📏 Total size: ${analysis.size.total_size || 'Unknown'}`);
      console.log(`  🔍 Indexes: ${analysis.indexes.length}`);

      return analysis;
    } catch (error) {
      console.error(`❌ Error analyzing table ${tableName}:`, error.message);
      return null;
    }
  }

  async analyzeSlowQueries() {
    console.log('\n🐌 Analyzing slow queries...');
    
    try {
      // Получаем медленные запросы (если включен pg_stat_statements)
      const slowQueries = await this.client.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 100 
        ORDER BY mean_time DESC 
        LIMIT 10
      `);

      if (slowQueries.rows.length > 0) {
        console.log('  Found slow queries:');
        slowQueries.rows.forEach((query, index) => {
          console.log(`    ${index + 1}. ${query.mean_time.toFixed(2)}ms avg - ${query.calls} calls`);
          console.log(`       ${query.query.substring(0, 100)}...`);
        });
      } else {
        console.log('  ✅ No slow queries found (or pg_stat_statements not enabled)');
      }

      return slowQueries.rows;
    } catch (error) {
      console.log('  ⚠️  pg_stat_statements not available or not enabled');
      return [];
    }
  }

  async checkIndexUsage() {
    console.log('\n🔍 Checking index usage...');
    
    try {
      const unusedIndexes = await this.client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0 
        AND schemaname = 'public'
        ORDER BY pg_relation_size(indexrelid) DESC
      `);

      if (unusedIndexes.rows.length > 0) {
        console.log('  ❌ Unused indexes found:');
        unusedIndexes.rows.forEach(index => {
          console.log(`    - ${index.tablename}.${index.indexname} (${index.index_size})`);
        });
      } else {
        console.log('  ✅ All indexes are being used');
      }

      return unusedIndexes.rows;
    } catch (error) {
      console.error('❌ Error checking index usage:', error.message);
      return [];
    }
  }

  async suggestOptimizations(analysis) {
    console.log('\n💡 Optimization Suggestions');
    console.log('===========================');

    const suggestions = [];

    // Анализ мертвых кортежей
    Object.values(analysis).forEach(table => {
      if (table && table.stats && table.stats.dead_tuples > 0) {
        const deadRatio = table.stats.dead_tuples / (table.stats.live_tuples + table.stats.dead_tuples);
        if (deadRatio > 0.1) {
          suggestions.push({
            type: 'VACUUM',
            table: table.tableName,
            reason: `High dead tuple ratio: ${(deadRatio * 100).toFixed(1)}%`,
            command: `VACUUM ANALYZE ${table.tableName};`
          });
        }
      }
    });

    // Анализ индексов
    Object.values(analysis).forEach(table => {
      if (table && table.indexes) {
        table.indexes.forEach(index => {
          if (index.index_scans === 0) {
            suggestions.push({
              type: 'INDEX',
              table: table.tableName,
              reason: `Unused index: ${index.indexname}`,
              command: `DROP INDEX IF EXISTS ${index.indexname};`
            });
          }
        });
      }
    });

    // Предложения по новым индексам
    const commonQueries = [
      { table: 'users', columns: ['telegramId'], reason: 'Frequent lookups by telegramId' },
      { table: 'users', columns: ['steps'], reason: 'Leaderboard queries' },
      { table: 'users', columns: ['lastAwake'], reason: 'Awake time queries' }
    ];

    commonQueries.forEach(query => {
      const table = analysis[query.table];
      if (table) {
        const hasIndex = table.indexes.some(index => 
          query.columns.every(col => index.indexdef.includes(col))
        );
        
        if (!hasIndex) {
          suggestions.push({
            type: 'INDEX',
            table: query.table,
            reason: query.reason,
            command: `CREATE INDEX IF NOT EXISTS idx_${query.table}_${query.columns.join('_')} ON ${query.table} (${query.columns.join(', ')});`
          });
        }
      }
    });

    if (suggestions.length > 0) {
      suggestions.forEach((suggestion, index) => {
        console.log(`\n${index + 1}. ${suggestion.type} - ${suggestion.table}`);
        console.log(`   Reason: ${suggestion.reason}`);
        console.log(`   Command: ${suggestion.command}`);
      });
    } else {
      console.log('✅ No optimization suggestions found');
    }

    return suggestions;
  }

  async runOptimizations(suggestions) {
    console.log('\n🚀 Running Optimizations');
    console.log('========================');

    const results = [];

    for (const suggestion of suggestions) {
      try {
        console.log(`\n⚡ Running: ${suggestion.command}`);
        const startTime = Date.now();
        
        await this.client.query(suggestion.command);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Completed in ${duration}ms`);
        
        results.push({
          ...suggestion,
          success: true,
          duration
        });
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        results.push({
          ...suggestion,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async generateReport(analysis, suggestions, results) {
    const report = {
      timestamp: new Date().toISOString(),
      analysis,
      suggestions,
      results,
      summary: {
        tablesAnalyzed: Object.keys(analysis).length,
        suggestionsGenerated: suggestions.length,
        optimizationsRun: results.length,
        successfulOptimizations: results.filter(r => r.success).length
      }
    };

    const reportPath = path.join(__dirname, '..', 'logs', 'database-optimization-report.json');
    const logsDir = path.dirname(reportPath);
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

    return report;
  }
}

async function main() {
  const optimizer = new DatabaseOptimizer();
  
  try {
    await optimizer.connect();
    
    // Анализируем основные таблицы
    const tables = ['users', 'missions', 'food_logs'];
    const analysis = {};
    
    for (const table of tables) {
      analysis[table] = await optimizer.analyzeTable(table);
    }
    
    // Анализируем медленные запросы
    const slowQueries = await optimizer.analyzeSlowQueries();
    
    // Проверяем использование индексов
    const unusedIndexes = await optimizer.checkIndexUsage();
    
    // Генерируем предложения по оптимизации
    const suggestions = await optimizer.suggestOptimizations(analysis);
    
    // Запускаем оптимизации (только безопасные)
    const safeSuggestions = suggestions.filter(s => 
      s.type === 'INDEX' && s.command.includes('CREATE INDEX')
    );
    
    const results = await optimizer.runOptimizations(safeSuggestions);
    
    // Генерируем отчет
    await optimizer.generateReport(analysis, suggestions, results);
    
    console.log('\n🎉 Database optimization completed!');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error);
  } finally {
    await optimizer.disconnect();
  }
}

// Запускаем оптимизацию
main().catch(console.error);
