from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv
import os
import logging
from datetime import datetime


# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MySQL DB Config from environment variables with defaults
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', '(@Sasi_0077)'),
    'database': os.getenv('DB_NAME', 'vd')
}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    try:
        return mysql.connector.connect(**db_config)
    except mysql.connector.Error as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise

# Voter login
@app.route('/voters', methods=['GET'])
def get_voter():
    phone = request.args.get('phoneNumber')
    password = request.args.get('password')

    if not phone or not password:
        return jsonify({'success': False, 'message': 'Missing phone or password'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM voters WHERE phoneNumber = %s AND password = %s", (phone, password))
        result = cursor.fetchall()

        logger.info(f"Login attempt for phone {phone}, result: {result}")

        if not result:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        return jsonify({'success': True, 'voter': result[0]})
    except Exception as e:
        logger.error(f"Error in get_voter: {str(e)}")
        return jsonify({'success': False, 'error': 'Login failed'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Get candidates by district and constituency
@app.route('/candidates', methods=['GET'])
def get_candidates():
    district = request.args.get('district')
    constituency = request.args.get('constituency')

    if not district or not constituency:
        return jsonify({'error': 'Missing district or constituency'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT * FROM candidates WHERE district = %s AND constituency = %s"
        cursor.execute(query, (district, constituency))
        candidates = cursor.fetchall()
        
        logger.info(f"Fetched candidates for {district} - {constituency}")
        return jsonify(candidates), 200
    except Exception as e:
        logger.error(f"Error in get_candidates: {str(e)}")
        return jsonify({'error': 'Failed to fetch candidates'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Save or update candidates
@app.route('/candidates', methods=['POST'])
def save_candidates():
    data = request.json
    district = data.get('district')
    constituency = data.get('constituency')
    candidates = data.get('candidates', [])

    if not district or not constituency or not candidates:
        return jsonify({'error': 'Missing required fields'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Delete existing candidates for the given district and constituency
        cursor.execute(
            "DELETE FROM candidates WHERE district = %s AND constituency = %s",
            (district, constituency)
        )
        
        # Insert new candidates
        query = """
            INSERT INTO candidates (id, name, party, symbol, votes, district, constituency)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        for candidate in candidates:
            cursor.execute(query, (
                candidate['id'],
                candidate['name'],
                candidate.get('party', 'Independent'),
                candidate.get('symbol', '⭐'),
                candidate.get('votes', 0),
                district,
                constituency
            ))
        
        # Commit the transaction
        conn.commit()
        logger.info(f"Saved {len(candidates)} candidates for {district} - {constituency}")
        return jsonify({'message': 'Candidates saved successfully'}), 201
    except Exception as e:
        logger.error(f"Error in save_candidates: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': 'Failed to save candidates'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Delete candidate
@app.route('/candidates/<string:candidate_id>', methods=['DELETE'])
def delete_candidate(candidate_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Delete the candidate with the specified id
        cursor.execute("DELETE FROM candidates WHERE id = %s", (candidate_id,))

        # Check if any row was deleted
        if cursor.rowcount == 0:
            return jsonify({'error': 'Candidate not found'}), 404

        conn.commit()
        return jsonify({'message': 'Candidate deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error in delete_candidate: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': 'Failed to delete candidate'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Cast vote
@app.route('/api/vote', methods=['POST'])
def cast_vote():
    data = request.get_json()
    phone = data.get('phone')
    candidate_id = data.get('candidate_id')
    district = data.get('district')
    constituency = data.get('constituency')

    if not phone or not candidate_id or not district or not constituency:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if already voted
        cursor.execute("SELECT hasVoted FROM voters WHERE phoneNumber = %s", (phone,))
        result = cursor.fetchone()
        if result and result[0] == 1:
            return jsonify({"error": "User has already voted"}), 409

        # Increment candidate's vote count
        cursor.execute("UPDATE candidates SET votes = votes + 1 WHERE id = %s", (candidate_id,))

        # Insert the vote into the 'votes' table
        cursor.execute("""
            INSERT INTO votes (candidate_id, district, constituency, voter_phone)
            VALUES (%s, %s, %s, %s)
        """, (candidate_id, district, constituency, phone))

        # ✅ Update voter's hasVoted to 1
        cursor.execute("UPDATE voters SET hasVoted = 1 WHERE phoneNumber = %s", (phone,))

        conn.commit()
        return jsonify({"message": "Vote cast successfully"}), 200

    except Exception as e:
        print("Error casting vote:", e)
        return jsonify({"error": "Server error"}), 500

    finally:
        if conn:
            conn.close()

# Check if voter has voted
@app.route('/api/has-voted', methods=['GET'])
def has_voted():
    phone = request.args.get('phone')
    if not phone:
        return jsonify({'hasVoted': 0, 'message': 'Phone number required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT hasVoted FROM voters WHERE phoneNumber = %s", (phone,))
        result = cursor.fetchone()
        if result:
            return jsonify({'hasVoted': int(result['hasVoted'])})
        else:
            return jsonify({'hasVoted': 0, 'message': 'Voter not found'}), 404
    except Exception as e:
        logger.error(f"Error in has_voted: {str(e)}")
        return jsonify({'hasVoted': 0, 'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

#save# Save winner
@app.route('/api/save-winner', methods=['POST'])
def save_winner():
    data = request.get_json()
    district = data.get("district")
    constituency = data.get("constituency")
    winner_id = data.get("winnerId")

    if not district or not constituency or not winner_id:
        return jsonify({"error": "Missing district, constituency, or winnerId"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO results (district, constituency, winner_id, published)
            VALUES (%s, %s, %s, 0)
            ON DUPLICATE KEY UPDATE winner_id = VALUES(winner_id)
        """
        cursor.execute(query, (district, constituency, winner_id))
        conn.commit()

        return jsonify({"message": "Winner saved successfully"}), 200
    except mysql.connector.Error as db_err:
        logger.error(f"Database error in save_winner: {str(db_err)}")
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        logger.error(f"Unexpected error in save_winner: {str(e)}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



# Get winner
@app.route('/api/results/winner', methods=['GET'])
def get_winner():
    district = request.args.get('district')
    constituency = request.args.get('constituency')

    if not district or not constituency:
        return jsonify({'error': 'District and constituency are required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get the winner_id from the results table
        cursor.execute("""
            SELECT winner_id FROM results WHERE district = %s AND constituency = %s AND published = 1
        """, (district, constituency))
        result = cursor.fetchone()

        if result:
            winner_id = result[0]
            # Get candidate details for the winner_id
            cursor.execute("""
                SELECT * FROM candidates WHERE id = %s
            """, (winner_id,))
            candidate = cursor.fetchone()

            if candidate:
                winner = {
                    'id': candidate[0],
                    'name': candidate[1],
                    'party': candidate[2],
                    'symbol': candidate[3],
                    'votes': candidate[4],
                }
                return jsonify(winner)
            else:
                return jsonify({'error': 'Winner candidate not found'}), 404
        else:
            return jsonify({'error': 'Winner not found for this constituency'}), 404

    except Exception as e:
        return jsonify({'error': f'Error fetching winner: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()


# Publish results
@app.route('/api/publish-results', methods=['POST'])
def publish_results():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update the status to 'published' for all constituencies that have results
        query = """
            UPDATE results 
            SET published = TRUE 
            WHERE winner_id IS NOT NULL
        """
        cursor.execute(query)
        conn.commit()

        logger.info("Election results have been published successfully.")
        return jsonify({"message": "Election results published successfully."}), 200
    except Exception as e:
        logger.error(f"Error in publish_results: {str(e)}")
        return jsonify({"error": "Failed to publish results"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
# Check if results are published
@app.route('/api/results/status', methods=['GET'])
def check_results_status():
    cursor = None
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT published FROM results LIMIT 1")
        result = cursor.fetchone()

        # Ensure the 'published' field exists and is an integer (0 or 1)
        if result and 'published' in result:
            published = bool(result['published'])  # Convert to boolean (True or False)
            return jsonify({"published": published}), 200
        else:
            return jsonify({"published": False}), 200  # Default to False if no result or published field is missing

    except Exception as e:
        logger.error(f"Error in check_results_status: {str(e)}")
        return jsonify({"error": "Failed to check results status"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/results/status', methods=['PUT'])
def update_results_status():
    cursor = None
    conn = None
    try:
        # Getting data from the request
        data = request.get_json()
        if 'published' not in data:
            return jsonify({"error": "'published' field is required"}), 400

        published_status = data['published']  # True or False

        # Establishing database connection
        conn = get_db_connection()
        cursor = conn.cursor()

        # Updating the 'published' status in the results table
        cursor.execute("UPDATE results SET published = %s WHERE id = 1", (1 if published_status else 0,))  # Assuming there's only one row or you're updating the first row
        conn.commit()  # Committing the changes

        return jsonify({"message": "Results status updated successfully"}), 200

    except Exception as e:
        logger.error(f"Error in update_results_status: {str(e)}")
        return jsonify({"error": "Failed to update results status"}), 500
    finally:
        # Closing database connection and cursor
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/api/unpublish-results', methods=['POST'])
def unpublish_results():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Set published to FALSE for all rows
        query = """
            UPDATE results 
            SET published = FALSE 
            WHERE published = TRUE
        """
        cursor.execute(query)
        conn.commit()

        logger.info("Election results have been unpublished.")
        return jsonify({"message": "Election results hidden from voters."}), 200
    except Exception as e:
        logger.error(f"Error in unpublish_results: {str(e)}")
        return jsonify({"error": "Failed to unpublish results"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/results/all', methods=['GET'])
def get_all_results():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Query to fetch all the results (including the candidate id)
        query = """
            SELECT r.district, r.constituency, c.id as candidate_id, c.name, c.party, c.symbol, c.votes
            FROM results r
            JOIN candidates c ON r.winner_id = c.id
            WHERE r.published = 1  -- Ensure you only return published results
        """
        cursor.execute(query)
        results = cursor.fetchall()

        # Return empty array if no results are found
        if not results:
            return jsonify([]), 200  # Return an empty list instead of a 404

        return jsonify(results), 200

    except Exception as e:
        # Log the detailed error message for better debugging
        logger.error(f"Error fetching all results: {str(e)}")
        return jsonify({"error": "Server error occurred"}), 500

    finally:
        # Ensure connections are closed
        if cursor:
            cursor.close()
        if conn:
            conn.close()
@app.route('/api/election/announcement-date', methods=['POST'])
def save_announcement_date():
    data = request.get_json()
    announcement_date = data.get('announcement_date')

    if not announcement_date:
        return jsonify({'error': 'Date is required'}), 400

    try:
        announcement_date = datetime.strptime(announcement_date, '%Y-%m-%d').date()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM election_dates WHERE id = 1")
        existing_date = cursor.fetchone()
        print("Fetched row:", existing_date)

        if existing_date:
            cursor.execute("""
                UPDATE election_dates
                SET result_publish_date = %s, updated_at = NOW()
                WHERE id = 1
            """, (announcement_date,))
        else:
            cursor.execute("""
                INSERT INTO election_dates (id, result_publish_date)
                VALUES (1, %s)
            """, (announcement_date,))
        
        conn.commit()
        conn.close()

        return jsonify({'message': 'Announcement date saved successfully'}), 200

    except Exception as e:
        print("Error saving announcement date:", e)
        return jsonify({'error': 'Failed to save date'}), 500
@app.route('/api/election/announcement-date', methods=['GET'])
def get_announcement_date():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT result_publish_date FROM election_dates WHERE id = 1")
        row = cursor.fetchone()

        if row:
            result_date = row[0].strftime('%Y-%m-%d')  # Convert to string format
            return jsonify({'announcement_date': result_date}), 200
        else:
            return jsonify({'announcement_date': None}), 200

    except Exception as e:
        print("Error fetching announcement date:", e)
        return jsonify({'error': 'Failed to fetch announcement date'}), 500


if __name__ == '__main__':
    app.run(debug=True)
