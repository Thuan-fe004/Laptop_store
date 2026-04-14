# backend/ai_chat.py
import re
import os
import logging
import numpy as np
from groq import Groq
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from knowledge_base import KNOWLEDGE_BASE

logger = logging.getLogger(__name__)

# ── Groq client ───────────────────────────────────────────────
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.3-70b-versatile"  # Miễn phí, nhanh, hỗ trợ tiếng Việt tốt

# ── Embedding model ───────────────────────────────────────────
try:
    embedder = SentenceTransformer('keepitreal/vietnamese-sbert')
    logger.info("✅ Embedding model loaded")
except Exception:
    embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    logger.info("✅ Fallback embedding model loaded")

_kb_texts      = [f"{k['topic']} {k['content']}" for k in KNOWLEDGE_BASE]
_kb_embeddings = embedder.encode(_kb_texts, show_progress_bar=False)
logger.info(f"✅ Knowledge base: {len(KNOWLEDGE_BASE)} entries")


# ════════════════════════════════════════════════════════════
# INTENT DETECTION
# ════════════════════════════════════════════════════════════
INTENTS = {
    'greeting':    ['xin chào', 'hello', 'hi', 'chào', 'hey', 'alo'],
    'thanks':      ['cảm ơn', 'thank', 'thanks', 'tks'],
    'price':       ['giá', 'bao nhiêu tiền', 'mấy tiền', 'mấy tr', 'triệu'],
    'recommend':   ['tư vấn', 'gợi ý', 'nên mua', 'chọn gì', 'phù hợp'],
    'compare':     ['so sánh', 'vs', 'khác nhau', 'tốt hơn'],
    'warranty':    ['bảo hành', 'hỏng', 'lỗi', 'sửa'],
    'shipping':    ['giao hàng', 'ship', 'vận chuyển', 'bao lâu'],
    'payment':     ['thanh toán', 'trả góp', 'cod', 'ngân hàng'],
    'return':      ['đổi trả', 'hoàn tiền', 'trả hàng'],
    'gaming':      ['gaming', 'game', 'chơi game', 'rtx', 'chiến'],
    'office':      ['văn phòng', 'office', 'làm việc', 'mỏng nhẹ'],
    'student':     ['sinh viên', 'học sinh', 'học tập'],
    'graphics':    ['đồ họa', 'design', 'photoshop', 'render'],
    'programming': ['lập trình', 'code', 'developer', 'coding'],
    'macbook':     ['macbook', 'mac', 'apple', 'm1', 'm2', 'm3'],
    'care':        ['bảo quản', 'vệ sinh', 'chăm sóc'],
    'spec':        ['thông số', 'cấu hình', 'cpu', 'ram', 'ssd', 'màn hình', 'gpu'],
}

def detect_intent(message: str) -> list:
    msg_lower = message.lower()
    detected  = [k for k, kws in INTENTS.items() if any(w in msg_lower for w in kws)]
    return detected if detected else ['general']


# ════════════════════════════════════════════════════════════
# BUDGET EXTRACTION
# ════════════════════════════════════════════════════════════
def extract_budget(message: str):
    msg = message.lower()

    def to_vnd(n):
        return int(n * 1_000_000) if n < 1000 else int(n * 1_000)

    m = re.search(r'(?:từ|khoảng từ)?\s*(\d+(?:[.,]\d+)?)\s*(?:đến|-|tới)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)', msg)
    if m:
        return {"min": to_vnd(float(m.group(1).replace(',', '.'))),
                "max": to_vnd(float(m.group(2).replace(',', '.')))}

    m = re.search(r'(?:dưới|tối đa|không quá|<)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)', msg)
    if m:
        return {"min": 0, "max": to_vnd(float(m.group(1).replace(',', '.')))}

    m = re.search(r'(?:trên|từ|>)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)', msg)
    if m:
        return {"min": to_vnd(float(m.group(1).replace(',', '.'))), "max": 999_000_000}

    m = re.search(r'(?:khoảng|tầm|~)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)', msg)
    if m:
        mid = to_vnd(float(m.group(1).replace(',', '.')))
        return {"min": int(mid * 0.8), "max": int(mid * 1.2)}

    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)\b', msg)
    if m:
        return {"min": 0, "max": to_vnd(float(m.group(1).replace(',', '.')))}

    return None


# ════════════════════════════════════════════════════════════
# BRAND EXTRACTION
# ════════════════════════════════════════════════════════════
BRAND_KEYWORDS = {
    'ASUS':    ['asus', 'rog', 'tuf', 'zenbook', 'vivobook'],
    'Dell':    ['dell', 'xps', 'inspiron', 'alienware'],
    'HP':      ['hp', 'spectre', 'pavilion', 'victus', 'envy'],
    'Lenovo':  ['lenovo', 'thinkpad', 'ideapad', 'legion', 'yoga'],
    'Apple':   ['apple', 'macbook', 'mac'],
    'Acer':    ['acer', 'aspire', 'nitro', 'predator'],
    'MSI':     ['msi', 'raider', 'katana', 'creator'],
    'Samsung': ['samsung', 'galaxy book'],
}

def extract_brand(message: str):
    msg = message.lower()
    for brand, kws in BRAND_KEYWORDS.items():
        if any(kw in msg for kw in kws):
            return brand
    return None


# ════════════════════════════════════════════════════════════
# RAG: KNOWLEDGE BASE SEARCH
# ════════════════════════════════════════════════════════════
def search_knowledge(query: str, top_k: int = 3, threshold: float = 0.25) -> list:
    try:
        q_emb   = embedder.encode([query], show_progress_bar=False)
        scores  = cosine_similarity(q_emb, _kb_embeddings)[0]
        top_idx = np.argsort(scores)[::-1][:top_k]
        return [KNOWLEDGE_BASE[i]['content'] for i in top_idx if scores[i] >= threshold]
    except Exception as e:
        logger.error(f"Knowledge search error: {e}")
        return []


# ════════════════════════════════════════════════════════════
# RAG: TÌM SẢN PHẨM BẰNG RAW SQL
# ════════════════════════════════════════════════════════════
def search_products_sql(query: str, budget=None, brand: str = None, db=None, limit: int = 6) -> list:
    if db is None:
        return []
    try:
        where  = ["p.status = 1"]
        params = {}

        if query and len(query.strip()) > 1:
            words = [w for w in query.split() if len(w) > 2][:3]
            if words:
                conds = []
                for i, w in enumerate(words):
                    k = f"kw{i}"
                    conds.append(f"(p.name LIKE :{k} OR p.short_desc LIKE :{k})")
                    params[k] = f"%{w}%"
                where.append(f"({' OR '.join(conds)})")

        if brand:
            where.append("b.name LIKE :brand")
            params['brand'] = f"%{brand}%"

        if budget:
            if budget['min'] > 0:
                where.append("COALESCE(p.sale_price, p.price) >= :min_price")
                params['min_price'] = budget['min']
            if budget['max'] < 999_000_000:
                where.append("COALESCE(p.sale_price, p.price) <= :max_price")
                params['max_price'] = budget['max']

        params['limit'] = limit
        w_clause = " AND ".join(where)

        sql = f"""
            SELECT
                p.name,
                b.name      AS brand_name,
                p.price,
                p.sale_price,
                p.quantity,
                p.is_bestseller,
                p.avg_rating,
                p.slug
            FROM products p
            LEFT JOIN brands b ON b.id = p.brand_id
            WHERE {w_clause}
            ORDER BY p.is_bestseller DESC, p.avg_rating DESC
            LIMIT :limit
        """

        rows   = db.session.execute(db.text(sql), params).fetchall()
        result = []
        for r in rows:
            price     = r[3] if r[3] else r[2]
            old_price = r[2] if r[3] else None
            discount  = round((1 - r[3] / r[2]) * 100) if r[3] and r[2] else 0
            result.append({
                "name":          r[0],
                "brand":         r[1] or '',
                "price_fmt":     f"{price:,.0f}đ",
                "old_price_fmt": f"{old_price:,.0f}đ" if old_price else None,
                "discount":      discount,
                "quantity":      r[4] or 0,
                "is_bestseller": bool(r[5]),
                "avg_rating":    float(r[6]) if r[6] else 0,
                "slug":          r[7] or '',
            })
        return result

    except Exception as e:
        logger.error(f"Product SQL search error: {e}")
        return []


def format_products_context(products: list) -> str:
    if not products:
        return ""
    lines = [f"📦 Tìm thấy {len(products)} sản phẩm phù hợp:"]
    for i, p in enumerate(products, 1):
        line = f"{i}. {p['name']}"
        if p['brand']:
            line += f" ({p['brand']})"
        line += f" — 💰 {p['price_fmt']}"
        if p['old_price_fmt']:
            line += f" ~~{p['old_price_fmt']}~~ (-{p['discount']}%)"
        if p['quantity'] == 0:
            line += " ⚠️ HẾT HÀNG"
        elif p['quantity'] <= 5:
            line += f" ⚡ Còn {p['quantity']} sp"
        if p['is_bestseller']:
            line += " 🔥"
        if p['avg_rating'] > 0:
            line += f" ⭐{p['avg_rating']:.1f}"
        lines.append(line)
    return "\n".join(lines)


# ════════════════════════════════════════════════════════════
# SYSTEM PROMPT
# ════════════════════════════════════════════════════════════
SYSTEM_PROMPT = """Bạn là trợ lý AI chuyên nghiệp của LaptopStore — hệ thống bán laptop chính hãng uy tín tại Việt Nam.

NHIỆM VỤ:
• Tư vấn chọn laptop theo nhu cầu và ngân sách
• Giải đáp chính sách bảo hành, đổi trả, giao hàng, thanh toán
• So sánh sản phẩm, giải thích thông số kỹ thuật dễ hiểu
• Hướng dẫn mua hàng

PHONG CÁCH:
• Thân thiện, chuyên nghiệp, ngắn gọn (tối đa 200 từ)
• Dùng emoji phù hợp để dễ đọc
• Dùng bullet list khi liệt kê nhiều mục
• Hỏi thêm nếu cần để tư vấn chính xác hơn

QUY TẮC:
• KHÔNG bịa thông tin — chỉ dùng dữ liệu được cung cấp
• Nếu không chắc → gợi ý gọi hotline 1800-1234
• Luôn trả lời bằng tiếng Việt"""


# ════════════════════════════════════════════════════════════
# HÀM CHAT CHÍNH
# ════════════════════════════════════════════════════════════
def chat(user_message: str, history: list, db=None, stream: bool = False):
    # 1. Phân tích câu hỏi
    intents = detect_intent(user_message)
    budget  = extract_budget(user_message)
    brand   = extract_brand(user_message)

    # 2. Greeting/thanks nhanh
    if 'greeting' in intents and len(user_message.strip()) < 20:
        r = "Xin chào! 👋 Tôi là trợ lý AI của LaptopStore. Tôi có thể tư vấn laptop, giải đáp chính sách, so sánh sản phẩm. Bạn cần hỗ trợ gì ạ? 😊"
        return (x for x in [r]) if stream else r

    if 'thanks' in intents and len(user_message.strip()) < 20:
        r = "Không có gì! 😊 Rất vui được hỗ trợ bạn. Cần thêm tư vấn cứ hỏi mình nhé! 💻"
        return (x for x in [r]) if stream else r

    # 3. Tìm knowledge base
    kb_results = search_knowledge(user_message, top_k=3)

    # 4. Tìm sản phẩm bằng raw SQL
    products = search_products_sql(
        query  = f"{brand or ''} {user_message}".strip(),
        budget = budget,
        brand  = brand,
        db     = db,
    )

    # 5. Build context
    parts = []
    if kb_results:
        parts.append("📚 THÔNG TIN CỬA HÀNG:\n" + "\n---\n".join(kb_results))
    if products:
        parts.append(format_products_context(products))
    if budget:
        min_f = f"{budget['min']:,.0f}đ" if budget['min'] > 0 else "0đ"
        max_f = f"{budget['max']:,.0f}đ" if budget['max'] < 999_000_000 else "không giới hạn"
        parts.append(f"💰 Ngân sách: {min_f} – {max_f}")
    if brand:
        parts.append(f"🏷️ Thương hiệu: {brand}")

    context = "\n\n".join(parts)

    # 6. Build messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history[-8:]:
        if msg.get('role') in ('user', 'assistant') and msg.get('content'):
            messages.append({"role": msg['role'], "content": msg['content']})

    user_content = user_message
    if context:
        user_content = f"{user_message}\n\n[Dữ liệu hỗ trợ - không hiển thị với khách:]\n{context}"
    messages.append({"role": "user", "content": user_content})

    # 7. Gọi Groq API
    try:
        if stream:
            def _gen():
                response = client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=400,
                    stream=True,
                )
                for chunk in response:
                    c = chunk.choices[0].delta.content or ''
                    if c:
                        yield c
            return _gen()
        else:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=400,
            )
            return response.choices[0].message.content

    except Exception as e:
        logger.error(f"Groq error: {e}")
        err = "⚠️ Hệ thống AI đang gặp sự cố. Vui lòng thử lại hoặc gọi hotline **1800-1234**!"
        return (x for x in [err]) if stream else err