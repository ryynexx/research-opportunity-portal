import os
from flask import Flask, request, jsonify, send_from_directory
from db import get_db_connection

app = Flask(__name__)
# Serve the frontend files
FRONTEND_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'frontend'
)


@app.route('/')
def home():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/<path:filename>')
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

# GET: Retrieve all research opportunities
@app.route('/api/opportunities', methods=['GET'])
def get_opportunities():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM opportunities ORDER BY id")
        opportunities = cursor.fetchall()

        for opportunity in opportunities:
            opportunity['application_deadline'] = str(
                opportunity['application_deadline']
            )
            opportunity['created_at'] = str(opportunity['created_at'])

        return jsonify(opportunities), 200

    except Exception as error:
        app.logger.exception("Failed to retrieve opportunities")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# GET: Retrieve one opportunity by ID
@app.route('/api/opportunities/<int:opportunity_id>', methods=['GET'])
def get_opportunity(opportunity_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM opportunities WHERE id = %s",
            (opportunity_id,)
        )
        opportunity = cursor.fetchone()

        if opportunity is None:
            return jsonify({"error": "Opportunity not found"}), 404

        opportunity['application_deadline'] = str(
            opportunity['application_deadline']
        )
        opportunity['created_at'] = str(opportunity['created_at'])

        return jsonify(opportunity), 200

    except Exception:
        app.logger.exception("Failed to retrieve opportunity")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

# POST: Create a new research opportunity
@app.route('/api/opportunities', methods=['POST'])
def create_opportunity():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    required_fields = [
        'title',
        'description',
        'research_area',
        'faculty_name',
        'department',
        'required_skills',
        'available_positions',
        'application_deadline'
    ]

    for field in required_fields:
        if field not in data or data[field] is None or (
            isinstance(data[field], str) and not data[field].strip()
        ):
            return jsonify({"error": f"{field} is required"}), 400

    try:
        positions = int(data['available_positions'])

        if positions < 1:
            return jsonify({
                "error": "Available positions must be at least 1"
            }), 400

        if isinstance(data['available_positions'], bool):
            return jsonify({
                "error": "Available positions must be a positive integer"
            }), 400

        if str(positions) != str(data['available_positions']).strip():
            return jsonify({
                "error": "Available positions must be a whole number"
            }), 400

        from datetime import date
        deadline = date.fromisoformat(data['application_deadline'])

        if deadline < date.today():
            return jsonify({
                "error": "Application deadline cannot be in the past"
            }), 400

    except (ValueError, TypeError):
        return jsonify({
            "error": "Enter a valid application deadline (YYYY-MM-DD) and positive whole number of positions"
        }), 400

    status = data.get('status', 'Open')

    if status not in ['Open', 'Closed']:
        return jsonify({
            "error": "Status must be Open or Closed"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO opportunities (
                title,
                description,
                research_area,
                faculty_name,
                department,
                required_skills,
                available_positions,
                application_deadline,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            data['title'].strip(),
            data['description'].strip(),
            data['research_area'].strip(),
            data['faculty_name'].strip(),
            data['department'].strip(),
            data['required_skills'].strip(),
            positions,
            deadline.isoformat(),
            status
        )

        cursor.execute(query, values)
        connection.commit()

        new_id = cursor.lastrowid

        return jsonify({
            "message": "Opportunity created successfully",
            "id": new_id
        }), 201

    except Exception:
        app.logger.exception("Failed to create opportunity")

        if connection and connection.is_connected():
            connection.rollback()

        return jsonify({"error": "Internal server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

# PUT: Update an existing research opportunity
@app.route('/api/opportunities/<int:opportunity_id>', methods=['PUT'])
def update_opportunity(opportunity_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    required_fields = [
        'title',
        'description',
        'research_area',
        'faculty_name',
        'department',
        'required_skills',
        'available_positions',
        'application_deadline',
        'status'
    ]

    for field in required_fields:
        if field not in data or data[field] is None or (
            isinstance(data[field], str) and not data[field].strip()
        ):
            return jsonify({"error": f"{field} is required"}), 400

    try:
        positions_value = data['available_positions']

        if isinstance(positions_value, bool):
            return jsonify({
                "error": "Available positions must be a positive whole number"
            }), 400

        positions = int(positions_value)

        if positions < 1 or str(positions) != str(positions_value).strip():
            return jsonify({
                "error": "Available positions must be a positive whole number"
            }), 400

        from datetime import date
        deadline = date.fromisoformat(data['application_deadline'])

        if deadline < date.today():
            return jsonify({
                "error": "Application deadline cannot be in the past"
            }), 400

    except (ValueError, TypeError):
        return jsonify({
            "error": "Enter a valid deadline (YYYY-MM-DD) and positive whole number of positions"
        }), 400

    if data['status'] not in ['Open', 'Closed']:
        return jsonify({
            "error": "Status must be Open or Closed"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id FROM opportunities WHERE id = %s",
            (opportunity_id,)
        )

        if cursor.fetchone() is None:
            return jsonify({"error": "Opportunity not found"}), 404

        query = """
            UPDATE opportunities
            SET title = %s,
                description = %s,
                research_area = %s,
                faculty_name = %s,
                department = %s,
                required_skills = %s,
                available_positions = %s,
                application_deadline = %s,
                status = %s
            WHERE id = %s
        """

        values = (
            data['title'].strip(),
            data['description'].strip(),
            data['research_area'].strip(),
            data['faculty_name'].strip(),
            data['department'].strip(),
            data['required_skills'].strip(),
            positions,
            deadline.isoformat(),
            data['status'],
            opportunity_id
        )

        cursor.execute(query, values)
        connection.commit()

        return jsonify({
            "message": "Opportunity updated successfully",
            "id": opportunity_id
        }), 200

    except Exception:
        app.logger.exception("Failed to update opportunity")

        if connection and connection.is_connected():
            connection.rollback()

        return jsonify({"error": "Internal server error"}), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()

# DELETE: Remove an existing research opportunity
@app.route('/api/opportunities/<int:opportunity_id>', methods=['DELETE'])
def delete_opportunity(opportunity_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id FROM opportunities WHERE id = %s",
            (opportunity_id,)
        )

        if cursor.fetchone() is None:
            return jsonify({"error": "Opportunity not found"}), 404

        cursor.execute(
            "DELETE FROM opportunities WHERE id = %s",
            (opportunity_id,)
        )

        connection.commit()

        return jsonify({
            "message": "Opportunity deleted successfully",
            "id": opportunity_id
        }), 200

    except Exception:
        app.logger.exception("Failed to delete opportunity")

        if connection and connection.is_connected():
            connection.rollback()

        return jsonify({"error": "Internal server error"}), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()
if __name__ == '__main__':
    app.run(debug=True)