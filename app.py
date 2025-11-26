from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import base64

app = Flask(__name__)


def craft_insight(score):
    if score > 180:
        return "High contrast areas detected. Please consult a medical professional if this reflects actual symptoms."
    if score > 120:
        return "Some texture irregularities appeared. Monitor regularly and log any physical changes."
    return "No intense contrasts detected. Continue routine self-checks and scheduled screenings."


def process_image(image):
    resized = cv2.resize(image, (512, 512))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    contrast = cv2.addWeighted(gray, 1.5, blur, -0.5, 0)
    edges = cv2.Canny(blur, 40, 160)
    edges_colored = cv2.applyColorMap(edges, cv2.COLORMAP_TURBO)
    heat = cv2.applyColorMap(contrast, cv2.COLORMAP_MAGMA)
    blend = cv2.addWeighted(cv2.cvtColor(contrast, cv2.COLOR_GRAY2BGR), 0.6, edges_colored, 0.8, 0)
    fusion = cv2.addWeighted(blend, 0.7, heat, 0.4, 0)
    score = int(np.mean(contrast) + np.std(contrast) * 3)
    return fusion, score


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/enhance")
def enhance():
    file = request.files.get("image")
    if not file or file.filename == "":
        return jsonify({"error": "Image required"}), 400
    data = np.frombuffer(file.read(), np.uint8)
    if data.size == 0:
        return jsonify({"error": "Empty image"}), 400
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if image is None:
        return jsonify({"error": "Unsupported image format"}), 400
    processed, score = process_image(image)
    success, buffer = cv2.imencode(".png", processed)
    if not success:
        return jsonify({"error": "Processing failed"}), 500
    encoded = base64.b64encode(buffer).decode("utf-8")
    return jsonify({"preview": f"data:image/png;base64,{encoded}", "insight": craft_insight(score)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
