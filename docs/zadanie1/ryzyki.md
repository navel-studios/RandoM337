## 5. Ryzyki (Macierz Ryzyka)

| Opis | Zadanie | Wiarygodność | Konsekwencje | Działanie łagodzące |
| :--- | :--- | :--- | :--- | :--- |
| Słabe zrozumienie domeny biznesowej, brak jej zainteresowania | 8 | Medium | High | Analiza feedback'u, restrukturyzacja celów w zadaniach 2-3, ewentualne przerobienie pewnych funkcjonalności |
| Błędne/słabe testy jednostkowe, ukryte bugi/wrażliwości | 7 | High | Medium | Zwracanie większej uwagi na zadania 2-4 |
| Nieprzewidziane nakłady czasu, przekroczenie deadline'ów implementacji | 6 | Low | High | Zwracanie większej uwagi na wzorce projektowe, diagramy itp., estymacja pracy |
| Nic nie działa | 6 | High | Low | Izolacja poszczególnych problemów, napisanie testów jednostkowych pod każdy, debugowanie |
| Desynchronizacja sesji w real-time | 7 | Medium | Medium | Beta-testing + testy jednostkowe + debugowanie |
| Cross-Site Scripting Vulnerability (XSS) | 8 | Low | High | Właściwe enkapsulowanie pól tekstowych |
| Nieintuicyjny/bugujący/wolny interfejs | 8 | Medium | Low | Slow & Steady... |
| Niedopuszczalny kontent | 8 | High | High | Weryfikacja, moderacja |
| Brak mocy obliczeniowej serwerów | 8 | Low | Low | Istnieje wiele popularnych rozwiązań, zarówno webowych, jak i fizycznych |