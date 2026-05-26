import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://www.vlr.gg/matches/results"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    print("Fetching VLR results page...")
    html = urllib.request.urlopen(req, timeout=10).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    match_cards = soup.find_all('a', href=re.compile(r'/^\d+'))
    if not match_cards:
        # Fallback to search for all <a> tags containing digit in href
        match_cards = [a for a in soup.find_all('a', href=True) if re.search(r'^/\d+/', a['href'])]
        
    print(f"Total match cards found: {len(match_cards)}")
    for card in match_cards[:5]:
        href = card['href']
        # Extract team names
        teams = card.find_all('div', {'class': 'match-item-vs-team-name'})
        team_str = " vs ".join([t.text.strip() for t in teams])
        
        # Extract event name
        event = card.find('div', {'class': 'match-item-event'})
        event_str = event.text.strip() if event else "Unknown Event"
        
        # Extract status/score
        score = card.find('div', {'class': 'match-item-vs-team-score'})
        score_str = score.text.strip() if score else ""
        
        print(f"HREF: {href} | Comps: {team_str} | Event: {event_str}")
except Exception as e:
    print("Error:", e)
