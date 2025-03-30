$(document).ready(function () {
  // Timer variables
  let timeLeft;
  let timerId = null;
  let isRunning = false;
  let isMeditation = true; // true for meditation, false for kinhin
  let isTransitioning = false;

  // DOM elements
  const $timer = $("#timer");
  const $status = $("#status");
  const $startBtn = $("#startBtn");
  const $pauseBtn = $("#pauseBtn");
  const $resetBtn = $("#resetBtn");
  const $meditationTime = $("#meditationTime");
  const $kinhinTime = $("#kinhinTime");
  const $enableMeditation = $("#enableMeditation");
  const $enableKinhin = $("#enableKinhin");
  const $timerSound = $("#timerSound")[0];

  // Play sound function
  function playSound() {
    $timerSound.currentTime = 0; // Reset sound to start
    $timerSound.play().catch((error) => {
      console.log("Sound play failed:", error);
    });
  }

  // Add error message elements
  $meditationTime.after(
    '<div class="invalid-feedback">Please enter a valid time (minimum 1 minute)</div>'
  );
  $kinhinTime.after(
    '<div class="invalid-feedback">Please enter a valid time (minimum 1 minute)</div>'
  );

  // Validate time input
  function validateTimeInput($input) {
    const value = $input.val();

    // Check if input is empty
    if (value === "") {
      $input.addClass("is-invalid");
      $input.next(".invalid-feedback").show();
      $status.text("Please enter a valid time");
      setTimeout(() => {
        if (!isRunning) {
          $status.text("Ready to begin");
        }
      }, 2000);
      return false;
    }

    // Check if value is less than 1
    const numValue = parseInt(value);
    if (numValue < 1) {
      $input.val(1);
      $input.addClass("is-invalid");
      $input.next(".invalid-feedback").show();
      $status.text("Minimum time is 1 minute");
      setTimeout(() => {
        if (!isRunning) {
          $status.text("Ready to begin");
        }
      }, 2000);
      return false;
    }

    // Valid input
    $input.removeClass("is-invalid");
    $input.next(".invalid-feedback").hide();
    return true;
  }

  // Format time as MM:SS
  function formatTime(seconds) {
    if (seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  // Update timer display
  function updateDisplay() {
    $timer.text(formatTime(timeLeft));
  }

  // Start transition period
  function startTransition() {
    isTransitioning = true;
    timeLeft = 30; // 30 second transition
    playSound(); // Play sound at start of transition
    $status.text(
      isMeditation
        ? "Meditation Complete. Prepare for Kinhin..."
        : "Kinhin Complete. Prepare for Meditation..."
    );

    timerId = setInterval(function () {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 0) {
        clearInterval(timerId);
        isTransitioning = false;
        playSound(); // Play sound at end of transition
        // Switch phase before starting new timer
        isMeditation = !isMeditation;

        // Check if next phase is enabled
        if (
          (isMeditation && !$enableMeditation.prop("checked")) ||
          (!isMeditation && !$enableKinhin.prop("checked"))
        ) {
          // If next phase is disabled, switch back to enabled phase
          isMeditation = $enableMeditation.prop("checked");
          if (!isMeditation && !$enableKinhin.prop("checked")) {
            // If neither is enabled, stop the timer
            $status.text("Session Complete");
            $startBtn.prop("disabled", false);
            $pauseBtn.prop("disabled", true);
            $resetBtn.prop("disabled", true);
            return;
          }
        }

        // Set the new time based on the new phase
        timeLeft = isMeditation
          ? $meditationTime.val() * 60
          : $kinhinTime.val() * 60;
        startTimer();
      }
    }, 1000);
  }

  // Start timer
  function startTimer() {
    // Check if at least one phase is enabled
    if (!$enableMeditation.prop("checked") && !$enableKinhin.prop("checked")) {
      $status.text("Please enable at least one meditation type");
      setTimeout(() => {
        if (!isRunning) {
          $status.text("Ready to begin");
        }
      }, 2000);
      return;
    }

    // Validate enabled times before starting
    const meditationValid =
      !$enableMeditation.prop("checked") || validateTimeInput($meditationTime);
    const kinhinValid =
      !$enableKinhin.prop("checked") || validateTimeInput($kinhinTime);

    if (!meditationValid || !kinhinValid) {
      return; // Don't start if enabled inputs are invalid
    }

    if (!isRunning) {
      isRunning = true;
      $startBtn.prop("disabled", true);
      $pauseBtn.prop("disabled", false);
      $resetBtn.prop("disabled", false);

      // Set initial time based on current phase if not already set
      if (timeLeft === undefined) {
        // Start with first enabled phase
        if ($enableMeditation.prop("checked")) {
          isMeditation = true;
          timeLeft = $meditationTime.val() * 60;
        } else if ($enableKinhin.prop("checked")) {
          isMeditation = false;
          timeLeft = $kinhinTime.val() * 60;
        }
      }

      $status.text(
        isMeditation ? "Meditation in Progress" : "Kinhin in Progress"
      );
      updateDisplay();

      timerId = setInterval(function () {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
          clearInterval(timerId);
          isRunning = false;
          playSound(); // Play sound at end of phase

          // Check if next phase is enabled before starting transition
          const nextPhaseIsMeditation = !isMeditation;
          if (
            (nextPhaseIsMeditation && !$enableMeditation.prop("checked")) ||
            (!nextPhaseIsMeditation && !$enableKinhin.prop("checked"))
          ) {
            // If next phase is disabled, end the session
            $status.text("Session Complete");
            $startBtn.prop("disabled", false);
            $pauseBtn.prop("disabled", true);
            $resetBtn.prop("disabled", true);
            return;
          }

          startTransition();
        }
      }, 1000);
    }
  }

  // Pause timer
  function pauseTimer() {
    if (isRunning || isTransitioning) {
      clearInterval(timerId);
      isRunning = false;
      isTransitioning = false;
      $startBtn.prop("disabled", false);
      $pauseBtn.prop("disabled", true);
      $status.text("Paused");
    }
  }

  // Reset timer
  function resetTimer() {
    clearInterval(timerId);
    isRunning = false;
    isTransitioning = false;
    isMeditation = true;
    timeLeft = undefined;
    $timer.text("00:00");
    $status.text("Ready to begin");
    $startBtn.prop("disabled", false);
    $pauseBtn.prop("disabled", true);
    $resetBtn.prop("disabled", true);

    // Clear any validation states
    $meditationTime.removeClass("is-invalid");
    $kinhinTime.removeClass("is-invalid");
    $(".invalid-feedback").hide();
  }

  // Event listeners
  $startBtn.on("click", startTimer);
  $pauseBtn.on("click", pauseTimer);
  $resetBtn.on("click", resetTimer);

  // Input validation on change and input
  $meditationTime.on("change input", function () {
    if ($enableMeditation.prop("checked")) {
      validateTimeInput($(this));
    }
  });

  $kinhinTime.on("change input", function () {
    if ($enableKinhin.prop("checked")) {
      validateTimeInput($(this));
    }
  });

  // Handle checkbox changes
  $enableMeditation.on("change", function () {
    if (!$(this).prop("checked") && !$enableKinhin.prop("checked")) {
      $status.text("Please enable at least one meditation type");
      setTimeout(() => {
        if (!isRunning) {
          $status.text("Ready to begin");
        }
      }, 2000);
    }
  });

  $enableKinhin.on("change", function () {
    if (!$(this).prop("checked") && !$enableMeditation.prop("checked")) {
      $status.text("Please enable at least one meditation type");
      setTimeout(() => {
        if (!isRunning) {
          $status.text("Ready to begin");
        }
      }, 2000);
    }
  });
});
