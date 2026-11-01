const API_BASE_URL = "http://localhost:8000";

document.addEventListener("alpine:init", () => {
    Alpine.data("bankingApp", () => ({
        currentScreen: "login",
        isLoading: false,
        isLoadingHome: false,
        isSearchingStudent: false,
        showPassword: false,
        errorMessage: "",
        lookupError: "",
        paymentError: "",
        paymentSuccess: "",
        accessToken: localStorage.getItem("access_token") || "",
        userInfo: null,
        balance: 0,
        transactions: [],
        studentQuery: "",
        studentResult: null,

        // Payment & OTP state
        isInitiatingPayment: false,
        isVerifyingOtp: false,
        otpModalOpen: false,
        selectedTuition: null,
        currentTransactionId: "",
        otpDigits: ["", "", "", "", "", ""],
        otpError: "",

        credentials: {
            username: "",
            password: "",
        },

        async init() {
            if (this.accessToken) {
                this.currentScreen = "home";
                await this.loadHomeData();
            }
        },

        formatCurrency(amount) {
            const num = Number(amount) || 0;
            return new Intl.NumberFormat("vi-VN").format(num);
        },

        async processLogin() {
            this.errorMessage = "";

            if (!this.credentials.username.trim() || !this.credentials.password.trim()) {
                this.errorMessage = "Please enter both username and password.";
                return;
            }

            this.isLoading = true;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: this.credentials.username.trim(),
                        password: this.credentials.password,
                    }),
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || "Invalid username or password.");
                }

                this.accessToken = data.access_token;
                localStorage.setItem("access_token", data.access_token);

                this.currentScreen = "home";
                await this.loadHomeData();
            } catch (error) {
                this.errorMessage = error.message || "Unable to connect to server.";
            } finally {
                this.isLoading = false;
            }
        },

        async loadHomeData() {
            if (!this.accessToken) return;
            this.isLoadingHome = true;

            try {
                const meRes = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                });

                if (meRes.status === 401) {
                    this.logout();
                    return;
                }

                const meData = await meRes.json().catch(() => ({}));
                if (meRes.ok && meData.user) {
                    this.userInfo = meData.user;

                    const ledgerRes = await fetch(`${API_BASE_URL}/users/${this.userInfo.id}/ledger`, {
                        headers: {
                            Authorization: `Bearer ${this.accessToken}`,
                        },
                    });

                    const ledgerData = await ledgerRes.json().catch(() => ({}));
                    if (ledgerRes.ok && ledgerData.ledger) {
                        this.balance = ledgerData.ledger.balance ?? 0;
                        this.transactions = ledgerData.ledger.transaction_history ?? [];
                    }
                }
            } catch (error) {
                console.error("Failed to load home data:", error);
            } finally {
                this.isLoadingHome = false;
            }
        },

        async lookupStudent() {
            this.lookupError = "";
            this.paymentError = "";
            this.paymentSuccess = "";
            this.studentResult = null;

            const studentId = this.studentQuery.trim().toUpperCase();
            if (!studentId) {
                this.lookupError = "Please enter a Student ID.";
                return;
            }

            this.isSearchingStudent = true;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/tuitions?student_id=${encodeURIComponent(studentId)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.accessToken}`,
                        },
                    },
                );

                if (response.status === 401) {
                    this.logout();
                    return;
                }

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || "Student not found.");
                }

                this.studentResult = data.student;
            } catch (error) {
                this.lookupError = error.message || "Unable to look up student.";
            } finally {
                this.isSearchingStudent = false;
            }
        },

        focusOtpBox(index) {
            this.$nextTick(() => {
                const el = document.getElementById(`otp-digit-${index}`);
                if (el) {
                    el.focus();
                    el.select();
                }
            });
        },

        handleOtpInput(event, index) {
            this.otpError = "";
            const raw = event.target.value.replace(/\D/g, "");
            const digit = raw.slice(-1);
            this.otpDigits[index] = digit;
            event.target.value = digit;

            if (digit && index < 5) {
                this.focusOtpBox(index + 1);
            }
        },

        handleOtpKeydown(event, index) {
            if (event.key === "Backspace") {
                if (!this.otpDigits[index] && index > 0) {
                    event.preventDefault();
                    this.otpDigits[index - 1] = "";
                    this.focusOtpBox(index - 1);
                } else {
                    this.otpDigits[index] = "";
                }
            } else if (event.key === "ArrowLeft" && index > 0) {
                event.preventDefault();
                this.focusOtpBox(index - 1);
            } else if (event.key === "ArrowRight" && index < 5) {
                event.preventDefault();
                this.focusOtpBox(index + 1);
            }
        },

        handleOtpPaste(event) {
            this.otpError = "";
            const pasted = (event.clipboardData || window.clipboardData)
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, 6);

            if (!pasted) return;

            for (let i = 0; i < 6; i++) {
                this.otpDigits[i] = pasted[i] || "";
            }

            const focusIdx = Math.min(pasted.length, 5);
            this.focusOtpBox(focusIdx);
        },

        getPendingTxForTuition(tuitionId) {
            return this.transactions.find(
                (t) => t.tuition_id === tuitionId && (t.status || "").toLowerCase() === "pending",
            );
        },

        handlePayClick(tuition) {
            const pendingTx = this.getPendingTxForTuition(tuition.id);
            if (pendingTx) {
                this.resumePendingTransaction(pendingTx, tuition);
            } else {
                this.initiatePayment(tuition);
            }
        },

        resumePendingTransaction(tx, tuition = null) {
            this.paymentError = "";
            this.paymentSuccess = "";
            this.selectedTuition = tuition || {
                id: tx.tuition_id,
                amount: tx.amount,
            };
            this.currentTransactionId = tx.id;
            this.otpDigits = ["", "", "", "", "", ""];
            this.otpError = "";
            this.otpModalOpen = true;
            this.focusOtpBox(0);
        },

        async resendOtp() {
            if (!this.selectedTuition) return;
            await this.initiatePayment(this.selectedTuition);
        },

        async initiatePayment(tuition) {
            this.paymentError = "";
            this.paymentSuccess = "";
            this.selectedTuition = tuition;
            this.isInitiatingPayment = true;

            try {
                const response = await fetch(`${API_BASE_URL}/payment`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                    body: JSON.stringify({
                        tuition_id: tuition.id,
                        amount: tuition.amount,
                    }),
                });

                if (response.status === 401) {
                    this.logout();
                    return;
                }

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || "Failed to initiate payment.");
                }

                this.currentTransactionId = data.transaction_id;
                this.otpDigits = ["", "", "", "", "", ""];
                this.otpError = "";
                this.otpModalOpen = true;
                this.focusOtpBox(0);
                await this.loadHomeData();
            } catch (error) {
                this.paymentError = error.message || "Unable to create payment transaction.";
            } finally {
                this.isInitiatingPayment = false;
            }
        },

        async verifyOtpPayment() {
            this.otpError = "";
            const otp = this.otpDigits.join("");

            if (!/^\d{6}$/.test(otp)) {
                this.otpError = "Please enter all 6 digits of the OTP code.";
                return;
            }

            this.isVerifyingOtp = true;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/payment/${this.currentTransactionId}/verify`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${this.accessToken}`,
                        },
                        body: JSON.stringify({ otp }),
                    },
                );

                if (response.status === 401) {
                    this.logout();
                    return;
                }

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || "Invalid or expired OTP.");
                }

                this.otpModalOpen = false;
                this.paymentSuccess = "Payment completed successfully!";
                await Promise.all([this.loadHomeData(), this.lookupStudent()]);
                this.paymentSuccess = "Payment completed successfully!";
            } catch (error) {
                this.otpError = error.message || "Verification failed.";
                await this.loadHomeData();
            } finally {
                this.isVerifyingOtp = false;
            }
        },

        closeOtpModal() {
            if (this.isVerifyingOtp) return;
            this.otpModalOpen = false;
            this.otpDigits = ["", "", "", "", "", ""];
            this.otpError = "";
        },

        logout() {
            this.accessToken = "";
            this.userInfo = null;
            this.balance = 0;
            this.transactions = [];
            this.studentQuery = "";
            this.studentResult = null;
            this.lookupError = "";
            this.paymentError = "";
            this.paymentSuccess = "";
            this.otpModalOpen = false;
            this.credentials.password = "";
            localStorage.removeItem("access_token");
            this.currentScreen = "login";
        },
    }));
});



