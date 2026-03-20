# Zadanie 3: Przypadki użycia i diagramy w UML

## Część 1: Scenariusze przypadków użycia

### Nazwa: UC-01 Losowanie rozmówcy i przypisanie wyzwania
* **Aktorzy:** Użytkownik 
* **Odnośniki do wymagań:** FR-01, FR-02, FR-03 
* **Warunki początkowe:** Użytkownik znajduje się na stronie głównej aplikacji, wyraził zgodę na dostęp do kamery i mikrofonu w przeglądarce.
* **Warunki końcowe:** Użytkownik jest połączony z losowym partnerem w architekturze WebRTC, obaj mają aktywne strumienie i widzą wylosowane wyzwanie.
* **Scenariusz (główny przepływ):**
  1. Użytkownik klika przycisk "Losuj rozmówcę".
  2. System dodaje użytkownika do puli oczekujących.
  3. System znajduje drugiego oczekującego i zestawia połączenie.
  4. System losuje temat/wyzwanie z bazy danych.
  5. System wyświetla wyzwanie na ekranach obu użytkowników.
* **Scenariusz alternatywny (Brak wolnych rozmówców):**
  2a. W puli nie ma innych wolnych użytkowników.
  3a. System wyświetla animację "Oczekiwanie..." i ponawia próbę co kilka sekund, aż do skutku.
* **Odnośniki do innych scenariuszy:** - 

---

### Nazwa: UC-02 Pominięcie rozmówcy (Rozłączenie)
* **Aktorzy:** Użytkownik 
* **Odnośniki do wymagań:** FR-04 
* **Warunki początkowe:** Użytkownik jest w trakcie aktywnego połączenia wideo.
* **Warunki końcowe:** Sesja zostaje bezpowrotnie przerwana dla obu stron.
* **Scenariusz (główny przepływ):**
  1. Użytkownik klika przycisk "Pomiń".
  2. System natychmiast przerywa połączenie wideo/audio.
  3. System wyświetla rozmówcy komunikat "Rozmówca opuścił czat".
  4. System automatycznie przenosi inicjatora z powrotem do kolejki losowania.
* **Scenariusz alternatywny (Utrata połączenia sieciowego):**
  1a. Użytkownik traci połączenie z internetem.
  2a. System wykrywa timeout WebRTC i automatycznie rozłącza sesję, wyświetlając rozmówcy komunikat o błędzie połączenia.
* **Odnośniki do innych scenariuszy:** Uruchamia UC-01 (Losowanie rozmówcy) 

---

### Nazwa: UC-03 Komunikacja za pomocą czatu tekstowego
* **Aktorzy:** Użytkownik 
* **Odnośniki do wymagań:** FR-05, NFR-02 
* **Warunki początkowe:** Użytkownicy są ze sobą połączeni w aktywnej sesji.
* **Warunki końcowe:** Wiadomość zostaje bezpiecznie dostarczona i wyświetlona na ekranie rozmówcy.
* **Scenariusz (główny przepływ):**
  1. Użytkownik wpisuje wiadomość tekstową w polu czatu i wciska "Wyślij".
  2. System weryfikuje wiadomość i szyfruje ciąg znaków (zabezpieczenie XSS).
  3. System przesyła wiadomość przez kanał danych (Data Channel).
  4. Wiadomość pojawia się w okienku czatu u drugiego użytkownika.
* **Scenariusz alternatywny (Wykrycie niedozwolonego linku):**
  2a. System wykrywa hiperłącze do zewnętrznej, niezaufanej strony.
  3a. System blokuje wysłanie wiadomości i wyświetla nadawcy błąd: "Wysyłanie linków jest zabronione".
* **Odnośniki do innych scenariuszy:** - 

---

### Nazwa: UC-04 Wyrażenie pozytywnej reakcji wideo
* **Aktorzy:** Użytkownik 
* **Odnośniki do wymagań:** FR-07 
* **Warunki początkowe:** Aktywne połączenie z rozmówcą.
* **Warunki końcowe:** Nakładka graficzna (animacja) pojawia się na wideo.
* **Scenariusz (główny przepływ):**
  1. Użytkownik klika jedną z ikon reakcji (np. Serce / Kciuk w górę).
  2. System rejestruje akcję i przesyła trigger do klienta rozmówcy.
  3. System generuje krótką animację cząsteczkową na ekranie rozmówcy.
* **Odnośniki do innych scenariuszy:** - 

---

### Nazwa: UC-05 Wzajemne polubienie (Match) po udanej rozmowie
* **Aktorzy:** Użytkownik
* **Odnośniki do wymagań:** FR-01 (rozszerzenie funkcji społecznościowej)
* **Warunki początkowe:** Użytkownicy są w trakcie połączenia lub właśnie zakończyli satysfakcjonującą rozmowę.
* **Warunki końcowe:** Użytkownicy zostają sparowani w systemie, wymieniają się pseudonimami i odblokowują opcję późniejszego czatu.
* **Scenariusz (główny przepływ):**
  1. Pierwszy użytkownik klika ikonę "Polub" (serce).
  2. System anonimowo zapisuje tę reakcję w pamięci sesji (nie informując jeszcze drugiej strony).
  3. Drugi użytkownik również klika ikonę "Polub".
  4. System wykrywa obustronną zgodę i natychmiast wyświetla obu stronom powiadomienie "Match!".
  5. System zapisuje powiązanie w bazie danych i dodaje użytkowników do ich wzajemnych "List kontaktów".
* **Scenariusz alternatywny (Brak wzajemności):**
  3a. Drugi użytkownik pomija rozmówcę (rozłącza się) bez klikania "Polub".
  4a. System odrzuca zapisaną reakcję pierwszego użytkownika i nie podejmuje żadnych dodatkowych akcji (zachowanie pełnej dyskrecji).
* **Odnośniki do innych scenariuszy:** Opcjonalnie rozszerza UC-01

---

### Nazwa: UC-6 Zaproponowanie nowego wyzwania do puli
* **Aktorzy:** Użytkownik
* **Odnośniki do wymagań:** FR-03 (wzbogacanie funkcjonalności losowania)
* **Warunki początkowe:** Użytkownik znajduje się na ekranie głównym aplikacji.
* **Warunki końcowe:** Propozycja nowego tematu jest zapisana w bazie i oczekuje na decyzję administracji.
* **Scenariusz (główny przepływ):**
  1. Użytkownik klika przycisk "Zaproponuj temat".
  2. Wypełnia pole tekstowe, wpisując swoje kreatywne wyzwanie.
  3. Klika "Wyślij propozycję".
  4. System weryfikuje długość tekstu oraz brak oczywistych wulgaryzmów.
  5. System zapisuje wyzwanie w bazie danych ze statusem "Oczekujące" i dziękuje użytkownikowi.
* **Scenariusz alternatywny (Niedozwolone słownictwo):**
  4a. System wykrywa na czarnej liście słowa wulgarne wpisane przez użytkownika.
  5a. Formularz zostaje odrzucony z komunikatem błędu: "Twoja propozycja zawiera niedozwolone słownictwo".
* **Odnośniki do innych scenariuszy:** Inicjuje UC-13

---

### Nazwa: UC-07 Przeglądanie osobistych statystyk i historii
* **Aktorzy:** Użytkownik (Zalogowany)
* **Odnośniki do wymagań:** -
* **Warunki początkowe:** Użytkownik jest zalogowany na swoje opcjonalne konto w systemie.
* **Warunki końcowe:** Użytkownik widzi podsumowanie swojej aktywności.
* **Scenariusz (główny przepływ):**
  1. Użytkownik z menu nawigacyjnego wybiera zakładkę "Mój Profil".
  2. System odpytuje bazę danych o metryki przypisane do identyfikatora tego użytkownika (ilość rozmów, otrzymane reakcje, zdobyte matche).
  3. System renderuje wykresy i statystyki na ekranie.
* **Scenariusz alternatywny (Brak aktywności):**
  2a. Baza danych zwraca zerowe wartości dla wszystkich metryk.
  3a. System wyświetla pusty widok z zachętą: "Nie masz jeszcze historii. Wylosuj swojego pierwszego rozmówcę!".
* **Odnośniki do innych scenariuszy:** -

---

### Nazwa: UC-08 Zmiana źródła kamery i mikrofonu
* **Aktorzy:** Użytkownik
* **Odnośniki do wymagań:** CON-02
* **Warunki początkowe:** Użytkownik posiada wiele podłączonych urządzeń wejścia (np. wbudowany mikrofon i słuchawki Bluetooth).
* **Warunki końcowe:** Nowe urządzenia nagrywające są aktywne, a strumień WebRTC zostaje zaktualizowany.
* **Scenariusz (główny przepływ):**
  1. Użytkownik w dowolnym momencie (w poczekalni lub w trakcie rozmowy) klika ikonę zębatki "Ustawienia Urządzeń".
  2. System odpytuje przeglądarkę o dostępne urządzenia (MediaDevices API).
  3. Użytkownik wybiera z listy rozwijanej nową kamerę i nowy mikrofon.
  4. System płynnie podmienia ścieżki (tracks) w aktywnym strumieniu WebRTC.
  5. Rozmówca natychmiast widzi/słyszy zmianę bez zrywania połączenia.
* **Scenariusz alternatywny (Urządzenie zajęte przez inną aplikację):**
  4a. Przeglądarka odrzuca próbę dostępu do wybranej kamery (np. jest używana przez OBS).
  5a. System przywraca poprzednio używaną kamerę i wyświetla alert: "Wybrane urządzenie jest zajęte".
* **Odnośniki do innych scenariuszy:** -

---

### Nazwa: UC-09 Zgłoszenie błędu technicznego (Bug Report)
* **Aktorzy:** Użytkownik 
* **Odnośniki do wymagań:** SYS-02 
* **Warunki początkowe:** Użytkownik napotkał problem z działaniem interfejsu lub połączenia.
* **Warunki końcowe:** Raport z logami konsoli trafia do bazy dla deweloperów.
* **Scenariusz (główny przepływ):**
  1. Użytkownik klika ukryty przycisk "Zgłoś błąd" w stopce strony.
  2. Wypełnia krótki formularz opisujący problem (np. "Kamera nagle zgasła").
  3. System dołącza do zgłoszenia meta-dane przeglądarki i przesyła paczkę do backendu.
* **Scenariusz alternatywny (Błąd krytyczny API):**
  3a. Serwer backendowy nie odpowiada.
  4a. System zapisuje raport w Local Storage przeglądarki do wysłania przy następnej udanej sesji.
* **Odnośniki do innych scenariuszy:** - 

---

### Nazwa: UC-10 Konfiguracja preferencji wyszukiwania
* **Aktorzy:** Użytkownik 
* **Odnośniki do wymagań:** NFR-01 
* **Warunki początkowe:** Użytkownik znajduje się na ekranie głównym.
* **Warunki końcowe:** Zaktualizowane filtry dobierania wyzwań i rozmówców są zapisane w sesji lokalnej.
* **Scenariusz (główny przepływ):**
  1. Użytkownik otwiera modal "Ustawienia Wyszukiwania".
  2. Odznacza kategorie wyzwań, których nie chce otrzymywać (np. wyłącza tag "Muzyczne").
  3. Zapisuje ustawienia i zamyka modal.
* **Odnośniki do innych scenariuszy:** Modyfikuje działanie UC-01 

---

### Nazwa: UC-11 Zgłoszenie naruszenia regulaminu
* **Aktorzy:** Użytkownik 
* **Odnośniki do wymagań:** FR-06 
* **Warunki początkowe:** Użytkownik jest połączony z rozmówcą, który łamie zasady platformy.
* **Warunki końcowe:** Incydent jest zapisany w bazie, a para natychmiastowo rozłączona.
* **Scenariusz (główny przepływ):**
  1. Użytkownik klika przycisk "Zgłoś" (ikona tarczy).
  2. System wyświetla listę powodów (Nagość / Agresja / Inne).
  3. Użytkownik wybiera powód i zatwierdza.
  4. System przechwytuje pojedynczą klatkę wideo rozmówcy jako dowód zbrodni.
  5. System zapisuje zgłoszenie (ID zgłaszającego, ID zgłoszonego, powód, zdjęcie).
  6. System wywołuje proces rozłączenia.
* **Odnośniki do innych scenariuszy:** Zawiera (include) UC-02, Inicjuje UC-08 

---

### Nazwa: UC-12 Weryfikacja zgłoszenia i nakładanie blokad (Moderacja)
* **Aktorzy:** Moderator 
* **Odnośniki do wymagań:** FR-05, SYS-03 
* **Warunki początkowe:** Moderator jest zalogowany do panelu administracyjnego.
* **Warunki końcowe:** Decyzja o zablokowaniu konta/IP zostaje podjęta i wprowadzona w życie. Zgłoszenie jest zarchiwizowane.
* **Scenariusz (główny przepływ):**
  1. Moderator otwiera listę oczekujących zgłoszeń od użytkowników.
  2. Otwiera detale konkretnego incydentu (przegląda załączony zrzut ekranu i historię zgłoszonego ID).
  3. Moderator stwierdza naruszenie zasad i klika "Nałóż Blokadę (Ban)".
  4. Wybiera czas trwania (np. 24h).
  5. System blokuje dostęp dla zbanowanego ID i odrzuca jego próby nawiązania nowych połączeń WebRTC.
* **Scenariusz alternatywny (Zgłoszenie niezasadne):**
  3a. Moderator po analizie stwierdza, że nie doszło do złamania regulaminu.
  4a. Klika "Odrzuć zgłoszenie".
  5a. System zamyka incydent bez konsekwencji dla zgłoszonego użytkownika.
* **Odnośniki do innych scenariuszy:** Stanowi kontynuację UC-07 

---

### Nazwa: UC-13 Weryfikacja propozycji nowych wyzwań
* **Aktorzy:** Moderator
* **Odnośniki do wymagań:** SYS-03 (panel administracyjny)
* **Warunki początkowe:** Moderator jest zalogowany do panelu i użytkownicy przesłali nowe propozycje.
* **Warunki końcowe:** Wyzwania trafiają do publicznej gry lub są trwale usuwane.
* **Scenariusz (główny przepływ):**
  1. Moderator otwiera zakładkę "Propozycje Wyzwań".
  2. System wyświetla listę oczekujących pomysłów nadesłanych przez graczy.
  3. Moderator analizuje wybrane wyzwanie pod kątem kreatywności i poprawności językowej.
  4. Moderator może edytować literówki w proponowanym tekście.
  5. Moderator klika "Zatwierdź".
  6. System zmienia status wyzwania na "Aktywne", dzięki czemu staje się ono dostępne do wylosowania (w UC-01).
* **Scenariusz alternatywny (Odrzucenie propozycji):**
  3a. Moderator stwierdza, że propozycja jest bezsensowna, powtarza się lub jest nieodpowiednia.
  4a. Moderator klika "Odrzuć".
  5a. System usuwa wyzwanie z bazy danych.
* **Odnośniki do innych scenariuszy:** Przetwarza zgłoszenia z UC-10
