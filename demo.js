document.addEventListener('DOMContentLoaded', () => {
    const scenes = document.querySelectorAll('.demo-scene');
    const notificationSound = document.getElementById('notification-sound');

    let currentSceneIndex = 0;
    let ticketCounter = 0;
    let currentTicket = '';
    let startTime;
    let endTime;

    // Elements for Scene 1 (Intro)
    const btnStartDemo = document.getElementById('btn-start-demo');

    // Elements for Scene 2 (Analyst Request)
    const btnAnalystRequest = document.getElementById('btn-analyst-request');
    const analystStatus = document.getElementById('analyst-status');
    const btnAnalystAdvance = document.getElementById('btn-analyst-advance');

    // Elements for Scene 3 (Overview)
    const overviewQueueList = document.getElementById('overview-queue-list');
    const btnCallNext = document.getElementById('btn-call-next');

    // Elements for Scene 4 (Meet)
    const analystInMeet = document.getElementById('analyst-in-meet');
    const btnEndCall = document.getElementById('btn-end-call');
    const meetTimeDisplay = document.querySelector('.meet-time');
    let meetTimerInterval;

    // Elements for Scene 5 (Results)
    const serviceTimeDisplay = document.getElementById('service-time');
    const resultsTableBody = document.getElementById('results-table-body');
    const btnViewReport = document.getElementById('btn-view-report');

    // Elements for Scene 6 (End)
    const btnRestartDemo = document.getElementById('btn-restart-demo');

    function showScene(index) {
        scenes[currentSceneIndex].classList.remove('active');
        scenes[index].classList.add('active');
        currentSceneIndex = index;
    }

    function resetDemo() {
        currentSceneIndex = 0;
        ticketCounter = 0;
        currentTicket = '';
        startTime = null;
        endTime = null;

        // Reset Scene 2
        btnAnalystRequest.textContent = 'Preciso de Suporte';
        btnAnalystRequest.disabled = false;
        analystStatus.textContent = '';
        analystStatus.classList.remove('active', 'success');
        btnAnalystAdvance.style.display = 'none';

        // Reset Scene 3
        overviewQueueList.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = 'Ninguém na fila.';
        overviewQueueList.appendChild(li);

        // Reset Scene 4
        clearInterval(meetTimerInterval);
        meetTimeDisplay.textContent = '00:00';

        // Reset Scene 5
        serviceTimeDisplay.textContent = '00:00';
        resultsTableBody.innerHTML = '';

        showScene(0);
    }

    // --- Scene 1: Intro ---
    btnStartDemo.addEventListener('click', () => {
        showScene(1);
    });

    // --- Scene 2: Analyst Request ---
    btnAnalystRequest.addEventListener('click', () => {
        if (ticketCounter === 0) { // Only allow one request for this demo flow
            currentTicket = Math.floor(10000000 + Math.random() * 90000000).toString(); // Random 8-digit number
            btnAnalystRequest.textContent = 'Aguardando na Fila...';
            btnAnalystRequest.disabled = true;

            analystStatus.textContent = `Você está na fila! Seu número de caso é ${currentTicket}.`;
            analystStatus.classList.add('active', 'success');

            setTimeout(() => {
                btnAnalystAdvance.style.display = 'block';
            }, 1500);
        }
    });

    btnAnalystAdvance.addEventListener('click', () => {
        // Update Scene 3 before showing it
        overviewQueueList.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = `Número do Caso: ${currentTicket}`;
        overviewQueueList.appendChild(li);

        showScene(2);
    });

    // --- Scene 3: Overview ---
    btnCallNext.addEventListener('click', () => {
        if (currentTicket) {
            notificationSound.currentTime = 0;
            notificationSound.play().catch(e => console.error("Erro ao tocar som:", e));

            // Simulate panel flash (no actual element, just conceptual)
            // Transition to Meet scene
            analystInMeet.textContent = `Analista (Número do Caso: ${currentTicket})`;
            startTime = new Date();
            let seconds = 0;
            meetTimerInterval = setInterval(() => {
                seconds++;
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                meetTimeDisplay.textContent = 
                    `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            }, 1000);

            showScene(3);
        } else {
            alert('Nenhum analista na fila para chamar!');
        }
    });

    // --- Scene 4: Meet ---
    btnEndCall.addEventListener('click', () => {
        clearInterval(meetTimerInterval);
        endTime = new Date();
        const durationMs = endTime - startTime;
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);
        
        serviceTimeDisplay.textContent = 
            `${String(durationMinutes).padStart(2, '0')}m ${String(durationSeconds).padStart(2, '0')}s`;

        // Add to results table
        const newRow = resultsTableBody.insertRow(0); // Add to top
        newRow.classList.add('highlight');
        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);
        const cell3 = newRow.insertCell(2);
        const cell4 = newRow.insertCell(3);

        cell1.textContent = `Número do Caso: ${currentTicket}`;
        cell2.textContent = 'Consultor 01'; // Fixed for demo
        cell3.textContent = serviceTimeDisplay.textContent;
        cell4.textContent = 'Finalizado';

        setTimeout(() => {
            newRow.classList.remove('highlight');
        }, 3000); // Remove highlight after 3 seconds

        showScene(4);
    });

    // --- Scene 5: Results ---
    btnViewReport.addEventListener('click', () => {
        resetDemo();
    });

    // --- Scene 6: End ---
    btnRestartDemo.addEventListener('click', () => {
        resetDemo();
    });

    // Initial setup
    resetDemo();
});
