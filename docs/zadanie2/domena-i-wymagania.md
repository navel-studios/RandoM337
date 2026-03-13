# Zadanie 2: Biznesowy opis domeny, persony, podróże użytkownika i wymagania

## 1. Opis domeny biznesowej
Domena biznesowa aplikacji RandoM337 to internetowa komunikacja wideo w czasie rzeczywistym i rozrywka społecznościowa (tzw. chat roulette). Odbiorcami oprogramowania są użytkownicy sieci poszukujący szybkich, niezobowiązujących i anonimowych interakcji z nowymi osobami z całego świata. 

Obecnie użytkownicy platform takich jak Omegle czy Emerald Chat często zmagają się z problemem trudności w nawiązaniu rozmowy lub brakiem wspólnych tematów, co kończy się szybkim rozłączeniem. RandoM337 wprowadza warstwę grywalizacji. System narzuca losowe wyzwania tematyczne, które zmuszają uczestników do zaangażowania i budują natychmiastowy kontekst do rozmowy, ułatwiając przełamanie pierwszych lodów. Użytkownicy, którzy nie chcą lub nie mogą podjąć wyzwania, są dyskwalifikowani (rozłączani), co naturalnie filtruje społeczność.

---

## 2. Persony

**Persona 1: Zwykły Użytkownik (Student)**
* **Imię:** Kamil
* **Wiek:** 21 lat
* **Doświadczenie:** Biegły w aplikacjach webowych i mobilnych, w przeszłości korzystał z podobnych platform.
* **Cele:** Chce się zrelaksować po zajęciach, poznać kogoś z poczuciem humoru i pośmiać się z absurdalnych sytuacji. Szuka lekkich, nieosobistych tematów.
* **Preferencje:** Ceni sobie szybkie ładowanie aplikacji i brak konieczności zakładania konta (anonimowość).
* **Frustracje:** Nudne początki rozmów, trolle, długie czekanie na znalezienie interesującego rozmówcy.
* **Zadania w systemie:** Losowanie kolejnych rozmówców, podejmowanie śmiesznych wyzwań narzuconych przez platformę.

**Persona 2: Poszukiwaczka Rozrywki (Ekstrawertyczka)**
* **Imię:** Zuzanna
* **Wiek:** 19 lat
* **Doświadczenie:** Aktywna na TikToku i w mediach społecznościowych. Płynnie porusza się po aplikacjach webowych.
* **Cele:** Szuka lekkich i nieosobistych tematów do rozmowy, które ułatwiają znalezienie wspólnego języka. Chętnie wykonuje kreatywne wyzwania, np. „Pokaż swój ulubiony, najdziwniejszy kubek” lub „Zrób śmieszną minę”.
* **Preferencje:** Szybki, intuicyjny interfejs, wyraźne i widoczne instrukcje do zadań, możliwość natychmiastowego pominięcia nudnego rozmówcy.
* **Frustracje:** Otrzymywanie niedopuszczalnego kontentu od innych użytkowników (tzw. flashowanie) lub rozmówcy, którzy ignorują zadania i po prostu milczą.
* **Zadania w systemie:** Rozmowa wideo, reagowanie na wykonane zadania przez innych, zgłaszanie (raportowanie) toksycznych zachowań.

**Persona 3: Moderator Społeczności (Weryfikator)**
* **Imię:** Marek
* **Wiek:** 25 lat
* **Doświadczenie:** Były moderator na dużych serwerach Discord. Zna specyfikę trollingu w internecie.
* **Cele:** Zapewnienie bezpieczeństwa na platformie poprzez szybką reakcję na zgłoszenia od użytkowników (mitygacja ryzyka "Niedopuszczalny kontent"). Chce sprawnie weryfikować, czy zgłoszony użytkownik faktycznie łamie regulamin.
* **Preferencje:** Przejrzysty panel z listą zgłoszeń, możliwość łatwego nakładania banów.
* **Frustracje:** Fałszywe zgłoszenia od złośliwych użytkowników, wolno działający panel (co spowalnia jego pracę).
* **Zadania w systemie:** Przeglądanie logów/raportów, weryfikacja zgłoszeń, moderacja i blokowanie użytkowników naruszających zasady.

**Persona 4: Administrator Systemu (Techniczny)**
* **Imię:** Tomasz
* **Wiek:** 32 lata
* **Doświadczenie:** Inżynier DevOps, zna się na utrzymaniu serwerów i optymalizacji aplikacji webowych. 
* **Cele:** Utrzymanie stabilności serwerów przy rosnącym ruchu, zapewnienie płynnej synchronizacji sesji w czasie rzeczywistym.
* **Preferencje:** Dostęp do metryk serwera, łatwe dodawanie nowych wyzwań do bazy.
* **Frustracje:** Częste awarie systemu, raporty użytkonikow.
* **Zadania w systemie:** Zarządzanie pulą wyzwań, nadawanie uprawnień moderatorom, dbanie o moc obliczeniową serwerów.

---

## 3. Podróże użytkownika

**Podróż 1: Udane wyzwanie i nawiązanie rozmowy**
1. **Kontekst:** Zuzanna pije herbatę ze swojego ulubionego, śmiesznego kubka i chce z kimś porozmawiać. Wchodzi na aplikację webową RandoM337.
2. **Akcja:** Zuzanna zezwala przeglądarce na dostęp do kamery/mikrofonu i klika przycisk losowania.
3. **Funkcjonalność:** System łączy ją z Kamilem i losuje temat rozmowy: "Pokaż najdziwniejszy kubek, jaki masz".
4. **Emocje/Postęp:** Oboje czytają wyzwanie na ekranie. Zuzanna podnosi swój kubek do kamery. Kamil szybko szuka swojego i robi to samo. Szybko znajdują wspólny język.
5. **Zakończenie:** Rozmawiają przez chwilę, po czym jedno z nich decyduje się wylosować nową osobę.

**Podróż 2: Odrzucenie rozmówcy (brak spełnienia warunków wyzwania)**
1. **Kontekst:** Kamil wchodzi na platformę w poszukiwaniu rozrywki.
2. **Akcja:** Łączy się z losowym użytkownikiem. System zadaje temat: "Zagraj coś na dowolnym instrumencie".
3. **Funkcjonalność/Postęp:** Kamil nie potrafi grać i nie ma instrumentu. Zuzanna (po drugiej stronie) widzi brak reakcji.
4. **Zakończenie:** Zuzanna uznaje, że Kamil nie zaliczył zadania i klika pomiń (dyskwalifikuje go), po czym system natychmiast szuka nowej pary.

---

## 4. Wymagania

### 4.4.1 Ograniczenia
* **CON-01:** Aplikacja musi działać jako aplikacja webowa w przeglądarce.
* **CON-02:** Użytkownik musi posiadać i udostępnić sprawną kamerę oraz mikrofon.
* **CON-03:** Konieczność ochrony przed wstrzykiwaniem złośliwego kodu.

### 4.4.2 Wymagania systemowe
* **SYS-01:** System wymaga architektury pozwalającej na poprawną synchronizację sesji w czasie rzeczywistym.
* **SYS-02:** System musi być optymalizowany pod kątem zużycia mocy obliczeniowej serwerów fizycznych lub webowych.
* **SYS-03:** System musi posiadać moduł administracyjny pozwalający na weryfikację i moderację niedopuszczalnego kontentu.

### 4.4.3 Wymagania funkcjonalne (MoSCoW)
* **FR-01 [Must Have]:** System musi anonimowo łączyć dwóch użytkowników w parę do rozmowy wideo.
* **FR-02 [Must Have]:** System musi obsługiwać przesyłanie strumieniowania wideo i audio.
* **FR-03 [Must Have]:** System musi losować i wyświetlać wyzwanie natychmiast po połączeniu użytkowników.
* **FR-04 [Must Have]:** Użytkownik musi mieć możliwość pominięcia obecnego rozmówcy i wylosowania nowego (np. w przypadku dyskwalifikacji).
* **FR-05 [Must Have]:** Moderator musi mieć narzędzia do blokowania (banowania) użytkowników generujących niedopuszczalne treści.
* **FR-06 [Should Have]:** Użytkownik powinien móc wysłać zgłoszenie (report) weryfikowane później przez moderację.
* **FR-07 [Could Have]:** System mógłby wyświetlać krótkie reakcje tekstowe w odpowiedzi na zadania (np. powiadomienie "USER A reacts").
* **FR-08 [Won't Have]:** System nie będzie posiadał mechanizmów AI automatycznie weryfikujących, czy wyzwanie zostało wykonane poprawnie (jest to oparte na umowie społecznej).

### 4.4.4 Wymagania niefunkcjonalne
* **NFR-01 (Bezpieczeństwo):** Pola wprowadzania danych i czatu muszą być właściwie enkapsulowane, aby chronić przed Cross-Site Scripting.
* **NFR-02 (Niezawodność):** Komunikacja real-time nie może prowadzić do zauważalnej desynchronizacji sesji między użytkownikami.
* **NFR-03 (Użyteczność):** Interfejs aplikacji musi być szybki, intuicyjny i unikać "bugowania".
