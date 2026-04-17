# backend/routes/chat_routes.py
import json
import logging
from flask import Blueprint, request, jsonify, Response, stream_with_context
from extensions import db
from ai_chat import chat, detect_intent, extract_budget, extract_brand

logger  = logging.getLogger(__name__)
chat_bp = Blueprint('chat', __name__)


# ── POST /api/chat ────────────────────────────────────────────
@chat_bp.route('/api/chat', methods=['POST'])
def handle_chat():
    try:
        data    = request.get_json(silent=True) or {}
        message = (data.get('message') or '').strip()
        history = data.get('history', [])

        if not message:
            return jsonify({"error": "Tin nhắn không được để trống"}), 400
        if len(message) > 500:
            return jsonify({"error": "Tin nhắn quá dài (tối đa 500 ký tự)"}), 400

        reply = chat(
            user_message = message,
            history      = history,
            db           = db,
            stream       = False,
        )

        return jsonify({
            "reply":   reply,
            "intents": detect_intent(message),
            "budget":  extract_budget(message),
            "brand":   extract_brand(message),
        })

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return jsonify({"reply": "⚠️ Có lỗi xảy ra. Vui lòng thử lại hoặc gọi 1800-1234!"}), 200


# ── POST /api/chat/stream ─────────────────────────────────────
@chat_bp.route('/api/chat/stream', methods=['POST'])
def handle_chat_stream():
    try:
        data    = request.get_json(silent=True) or {}
        message = (data.get('message') or '').strip()
        history = data.get('history', [])

        if not message:
            return jsonify({"error": "Tin nhắn không được để trống"}), 400

        gen = chat(
            user_message = message,
            history      = history,
            db           = db,
            stream       = True,
        )

        def event_stream():
            try:
                for chunk in gen:
                    if chunk:
                        payload = json.dumps({"chunk": chunk}, ensure_ascii=False)
                        yield f"data: {payload}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield f"data: {json.dumps({'chunk': '⚠️ Lỗi kết nối.', 'done': True})}\n\n"

        return Response(
            stream_with_context(event_stream()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control':               'no-cache',
                'X-Accel-Buffering':           'no',
                'Access-Control-Allow-Origin': '*',
            }
        )

    except Exception as e:
        logger.error(f"Stream setup error: {e}", exc_info=True)
        return jsonify({"error": "Lỗi khởi tạo stream"}), 500


# ── GET /api/chat/health ──────────────────────────────────────
@chat_bp.route('/api/chat/health', methods=['GET'])
def health_check():
    import os
    from groq import Groq
    status = {"ai_service": "unknown", "db": True, "model": "llama-3.3-70b-versatile"}
    try:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY chua duoc cau hinh")
        groq_client = Groq(api_key=api_key)
        models = groq_client.models.list()
        status["ai_service"]       = "online"
        status["available_models"] = [m.id for m in models.data]
    except Exception as e:
        status["ai_service"] = "offline"
        status["error"]      = str(e)

    return jsonify(status), 200 if status["ai_service"] == "online" else 503