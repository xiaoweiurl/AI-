import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080/api';

function getSessionId(request: NextRequest): string | null {
  const headerSession = request.headers.get('x-session-id');
  if (headerSession) return headerSession;
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const match = cookies.match(/session_id=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// ====== 数据库直查（后端不可用时降级） ======

let _pool: any = null;

async function getPool() {
  if (_pool) return _pool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set');
  const { Pool } = await import('pg');
  _pool = new Pool({
    connectionString: dbUrl,
    max: 3,
    ssl: dbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    idleTimeoutMillis: 30000,
  });
  return _pool;
}

async function dbQuery(sql: string, params?: any[]) {
  const pool = await getPool();
  const result = await pool.query(sql, params);
  // pg 返回 snake_case 列名，转为 camelCase 以匹配前端
  return result.rows.map((row: any) => {
    const obj: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      obj[camelKey] = value;
    }
    return obj;
  });
}

function pageResult(rows: any[], page: number, pageSize: number) {
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ====== 智能报价计算 ======

function calcSmartQuotes(
  quotations: any[],
  purchases: any[],
  accessories: any[],
  plans: any[],
  targetProfitRate: number = 0.3,
  processingCost: number = 0.15
) {
  // 采购价格映射：materialCode -> { price, supplier }
  const purchaseByCode = new Map<string, { price: number; supplier: string }>();
  for (const p of purchases) {
    const code = p.materialCode;
    const price = parseFloat(p.unitPrice) || 0;
    const existing = purchaseByCode.get(code);
    if (!existing || price < existing.price) {
      purchaseByCode.set(code, { price, supplier: p.supplier });
    }
  }

  // 生产计划映射：productCode -> plan
  const planByCode = new Map<string, any>();
  for (const pl of plans) {
    planByCode.set(pl.productCode, pl);
  }

  const products: any[] = [];

  for (const q of quotations) {
    // 原料明细
    const materials: { name: string; usage: number; purchasePrice: number; cost: number; bestSupplier: string }[] = [];
    let rawCost = 0;
    for (let i = 1; i <= 6; i++) {
      const name = q[`rawMaterialName${i}`];
      const usage = parseFloat(q[`materialUsage${i}`]) || 0;
      const unitPrice = parseFloat(q[`materialUnitPrice${i}`]) || 0;
      if (name && usage > 0) {
        const purchase = purchaseByCode.get(name);
        const purchasePrice = purchase?.price || unitPrice;
        const cost = usage * purchasePrice;
        rawCost += cost;
        materials.push({ name, usage, purchasePrice, cost: Math.round(cost * 10000) / 10000, bestSupplier: purchase?.supplier || '' });
      }
    }

    // 辅料成本
    const accessoryCost = parseFloat(q.accessoryPrice) || 0;

    // 生产计划信息
    const plan = planByCode.get(q.productCode);
    const sewingWeight = plan ? parseFloat(plan.sewingWeight) || 0 : 0;
    const dailyCapacity = plan ? parseFloat(plan.singleMachineOutput) * (plan.machineCount || 1) : 0;

    const totalMaterialCost = rawCost + accessoryCost;
    const totalCost = totalMaterialCost + processingCost;
    // targetProfitRate > 1 表示百分比形式(如30表示30%), <=1 表示小数形式(如0.3表示30%)
    const rate = targetProfitRate > 1 ? targetProfitRate / 100 : targetProfitRate;
    const suggestedPrice = totalCost / (1 - rate);
    const profitRate = suggestedPrice > 0 ? (suggestedPrice - totalCost) / suggestedPrice : 0;

    products.push({
      productCode: q.productCode,
      productionCode: q.productionCode || q.productCode,
      customer: q.customer || '',
      materials,
      accessoryCost: Math.round(accessoryCost * 100) / 100,
      accessoryName: q.accessoryName || '辅料',
      totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
      processingCostPerUnit: processingCost,
      totalCostPerUnit: Math.round(totalCost * 100) / 100,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      profitRate: Math.round(profitRate * 10000) / 10000,
      dailyCapacity,
      sewingWeight,
    });
  }

  return products;
}

// ====== 供应商对比 ======

function calcSupplierComparison(purchases: any[]) {
  const map = new Map<string, any[]>();
  for (const p of purchases) {
    const code = p.materialCode;
    if (!map.has(code)) map.set(code, []);
    map.get(code)!.push({ supplier: p.supplier, unitPrice: parseFloat(p.unitPrice) || 0 });
  }
  // 去重排序
  const comparison: Record<string, any[]> = {};
  for (const [code, list] of map) {
    comparison[code] = list.sort((a, b) => a.unitPrice - b.unitPrice);
  }
  return comparison;
}

// ====== 统计 ======

function calcStats(quotations: any[], purchases: any[], accessories: any[], smartProducts: any[]) {
  const materialCodes = new Set(purchases.map(p => p.materialCode));
  const suppliers = new Set(purchases.map(p => p.supplier));
  const avgProfitRate = smartProducts.length > 0
    ? smartProducts.reduce((sum: number, p: any) => sum + (p.profitRate || 0), 0) / smartProducts.length
    : 0;

  return {
    productCount: quotations.length,
    materialCount: materialCodes.size,
    supplierCount: suppliers.size,
    avgProfitRate: Math.round(avgProfitRate * 10000) / 10000,
    totalQuotationValue: Math.round(quotations.reduce((s: number, q: any) => s + (parseFloat(q.totalPrice) || 0), 0) * 100) / 100,
    totalPurchaseValue: Math.round(purchases.reduce((s: number, p: any) => s + (parseFloat(p.totalPrice) || 0), 0) * 100) / 100,
    totalAccessoryValue: Math.round(accessories.reduce((s: number, a: any) => s + (parseFloat(a.totalPrice) || 0), 0) * 100) / 100,
  };
}

// ====== 路由处理 ======

export async function GET(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const url = new URL(request.url);
  const { pathname, search } = url;
  const path = pathname.replace('/api/supply-chain', '');
  const searchParams = url.searchParams;

  // 先尝试代理到 Java 后端
  try {
    const backendRes = await fetch(`${BACKEND_URL}/supply-chain${path}${search}`, {
      headers: { 'X-Session-Id': sessionId, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch {
    // 后端不可用，降级到数据库直查
  }

  // ====== 降级：直接查数据库 ======
  try {
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');

    // 分页查询
    if (path === '/quotations') {
      const rows = await dbQuery('SELECT * FROM product_quotation ORDER BY id');
      return NextResponse.json(pageResult(rows, page, pageSize));
    }
    if (path === '/warehouse') {
      const rows = await dbQuery('SELECT * FROM raw_material_warehouse ORDER BY id');
      return NextResponse.json(pageResult(rows, page, pageSize));
    }
    if (path === '/purchases') {
      const rows = await dbQuery('SELECT * FROM raw_material_purchase ORDER BY id');
      return NextResponse.json(pageResult(rows, page, pageSize));
    }
    if (path === '/plans') {
      const rows = await dbQuery('SELECT * FROM production_plan ORDER BY id');
      return NextResponse.json(pageResult(rows, page, pageSize));
    }
    if (path === '/accessories') {
      const rows = await dbQuery('SELECT * FROM accessory_purchase ORDER BY id');
      return NextResponse.json(pageResult(rows, page, pageSize));
    }

    // 智能报价
    if (path === '/smart-quote/product-list') {
      const targetProfitRate = parseFloat(searchParams.get('targetProfitRate') || '0.3');
      const processingCost = parseFloat(searchParams.get('processingCost') || '0.15');
      const [quotations, purchases, accessories, plans] = await Promise.all([
        dbQuery('SELECT * FROM product_quotation'),
        dbQuery('SELECT * FROM raw_material_purchase'),
        dbQuery('SELECT * FROM accessory_purchase'),
        dbQuery('SELECT * FROM production_plan'),
      ]);
      const products = calcSmartQuotes(quotations, purchases, accessories, plans, targetProfitRate, processingCost);
      return NextResponse.json({ products });
    }

    // 供应商对比
    if (path === '/smart-quote/supplier-comparison') {
      const purchases = await dbQuery('SELECT * FROM raw_material_purchase');
      const comparison = calcSupplierComparison(purchases);
      return NextResponse.json({ comparison });
    }

    // 统计
    if (path === '/stats') {
      const tpr = parseFloat(searchParams.get('targetProfitRate') || '30');
      const pc = parseFloat(searchParams.get('processingCost') || '0.05');
      const [quotations, purchases, accessories, plans] = await Promise.all([
        dbQuery('SELECT * FROM product_quotation'),
        dbQuery('SELECT * FROM raw_material_purchase'),
        dbQuery('SELECT * FROM accessory_purchase'),
        dbQuery('SELECT * FROM production_plan'),
      ]);
      const smartProducts = calcSmartQuotes(quotations, purchases, accessories, plans, tpr, pc);
      const stats = calcStats(quotations, purchases, accessories, smartProducts);
      return NextResponse.json(stats);
    }

    return NextResponse.json({ error: '未知路径' }, { status: 404 });
  } catch (dbError: any) {
    console.error('[SupplyChain] 数据库查询失败:', dbError.message);
    return NextResponse.json({ error: '数据查询失败', details: dbError.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/supply-chain', '');

  // 尝试代理到后端
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const res = await fetch(`${BACKEND_URL}/supply-chain${path}`, {
        method: 'POST',
        headers: { 'X-Session-Id': sessionId },
        body: formData,
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
    body = await request.json();
    const res = await fetch(`${BACKEND_URL}/supply-chain${path}`, {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: '后端服务不可用' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/supply-chain', '');

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/supply-chain${path}`, {
      method: 'PUT',
      headers: { 'X-Session-Id': sessionId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: '后端服务不可用' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/supply-chain', '');

  try {
    const res = await fetch(`${BACKEND_URL}/supply-chain${path}`, {
      method: 'DELETE',
      headers: { 'X-Session-Id': sessionId },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: '后端服务不可用' }, { status: 503 });
  }
}
