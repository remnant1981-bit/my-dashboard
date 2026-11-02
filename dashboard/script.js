// 날짜 및 시간 업데이트
function updateDateTime() {
  const now = new Date();
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  };
  document.getElementById('dateTime').textContent = 
    now.toLocaleDateString('ko-KR', options);
}

// 진행률 바 애니메이션
function animateProgress() {
  const progressBars = document.querySelectorAll('.progress-fill');
  progressBars.forEach(bar => {
    const progress = bar.getAttribute('data-progress');
    bar.style.width = progress + '%';
  });
}

// 통계 카드 애니메이션
function animateStats() {
  const stats = document.querySelectorAll('.stat-value');
  stats.forEach(stat => {
    const finalValue = parseInt(stat.textContent);
    let currentValue = 0;
    const increment = finalValue / 50;
    
    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= finalValue) {
        stat.textContent = finalValue;
        clearInterval(timer);
      } else {
        stat.textContent = Math.floor(currentValue);
      }
    }, 20);
  });
}

// 프로젝트 추가 함수
function addProject() {
  const projectCount = document.getElementById('projectCount');
  const currentCount = parseInt(projectCount.textContent);
  projectCount.textContent = currentCount + 1;
  
  addActivity('새로운 프로젝트가 추가되었습니다');
  showNotification('✅ 프로젝트가 성공적으로 추가되었습니다!');
}

// 보고서 생성 함수
function generateReport() {
  const reportCount = document.getElementById('reportCount');
  const currentCount = parseInt(reportCount.textContent);
  reportCount.textContent = currentCount + 1;
  
  addActivity('새로운 보고서가 생성되었습니다');
  showNotification('📄 보고서가 성공적으로 생성되었습니다!');
}

// 데이터 새로고침 함수
function refreshData() {
  const progressBars = document.querySelectorAll('.progress-fill');
  progressBars.forEach(bar => {
    bar.style.width = '0';
  });
  
  setTimeout(() => {
    animateProgress();
  }, 100);
  
  addActivity('대시보드 데이터가 새로고침되었습니다');
  showNotification('🔄 데이터가 성공적으로 새로고침되었습니다!');
}

// 활동 로그 추가 함수
function addActivity(message) {
  const activityList = document.getElementById('activityList');
  const newActivity = document.createElement('div');
  newActivity.className = 'activity-item';
  newActivity.innerHTML = `
    <div class="activity-time">방금 전</div>
    <div class="activity-content">${message}</div>
  `;
  
  activityList.insertBefore(newActivity, activityList.firstChild);
  
  newActivity.style.opacity = '0';
  newActivity.style.transform = 'translateX(-20px)';
  setTimeout(() => {
    newActivity.style.transition = 'all 0.5s ease';
    newActivity.style.opacity = '1';
    newActivity.style.transform = 'translateX(0)';
  }, 10);
}

// 알림 표시 함수
function showNotification(message) {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 30px;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    z-index: 1000;
    animation: slideIn 0.5s ease;
    font-weight: 600;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  setTimeout(() => {
    animateProgress();
    animateStats();
  }, 300);
});

// 통계 카드 호버 효과
document.addEventListener('DOMContentLoaded', () => {
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
});
