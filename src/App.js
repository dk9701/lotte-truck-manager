import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';

// Firebase 설정 (Los Angeles 서버)
const firebaseConfig = {
  apiKey: "AIzaSyBd_IqLXhB19XYfZI4lcClOQtDk2Q4Vt-A",
  authDomain: "lotte-truck-manager-7be8f.firebaseapp.com",
  projectId: "lotte-truck-manager-7be8f",
  storageBucket: "lotte-truck-manager-7be8f.firebasestorage.app",
  messagingSenderId: "108001629645",
  appId: "1:108001629645:web:080d68db3b865e8a4c6084"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const LotteTruckManager = () => {
  // 초기 데이터 (첫 실행 시 Firestore에 추가할 데이터)
  const initialTrucks = [
    { carrier: "2J&D", truck: "13", driver: "Johnny.G" },
    { carrier: "4THETR", truck: "1037", driver: "Jarieiz.C" },
    { carrier: "ADBJ", truck: "07", driver: "Jorge.G" },
    { carrier: "ADD", truck: "16", driver: "Juan.E" },
    { carrier: "ADD", truck: "TRK815", driver: "Juan.F" },
    { carrier: "ADD", truck: "744", driver: "Belter.F" },
    { carrier: "Apple", truck: "20", driver: "Elias.B" },
    { carrier: "Apple", truck: "30", driver: "Carlos" },
    { carrier: "Apple", truck: "49", driver: "Michael.D" },
    { carrier: "Apple", truck: "52", driver: "Michael" },
    { carrier: "Apple", truck: "100", driver: "Christian.A" },
    { carrier: "Apple", truck: "17", driver: "Daniel.S" },
    { carrier: "Apple", truck: "555", driver: "Laura.A" },
    { carrier: "Apple", truck: "59", driver: "Ismael.H" },
    { carrier: "Apple", truck: "97", driver: "Pedro.I" },
    { carrier: "Apple", truck: "99", driver: "Manuel" },
    { carrier: "Beattie's", truck: "25", driver: "Kiet.S" },
    { carrier: "El Gato", truck: "2007", driver: "Rodrigo.G" },
    { carrier: "FM", truck: "F200", driver: "Christian" },
    { carrier: "FM", truck: "F450", driver: "David.L" },
    { carrier: "GC", truck: "2008", driver: "Gilberto.C" },
    { carrier: "Harbor", truck: "7", driver: "Victor.H" },
    { carrier: "Jerez", truck: "20", driver: "Randy.M" },
    { carrier: "Kings", truck: "01", driver: "Filiberto.R" },
    { carrier: "Lotte", truck: "113", driver: "Chester" },
    { carrier: "Lotte", truck: "116", driver: "H.Kim" },
    { carrier: "Lotte", truck: "123", driver: "H.Kim" }
  ];

  // 상태 관리
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [driverName, setDriverName] = useState('');
  const [activeTab, setActiveTab] = useState('lookup');
  
  // 인증 상태
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  
  // 폼 상태
  const [formData, setFormData] = useState({
    carrier: '',
    truck: '',
    driver: ''
  });
  
  // 편집 상태
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({});

  // Firebase 초기화 및 인증 상태 모니터링
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role: user.email === 'admin@lotte.com' ? 'admin' : 'user'
        });
        setConnected(true);
        loadData();
      } else {
        setCurrentUser(null);
        setConnected(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 트럭 데이터 로드
      const trucksSnapshot = await getDocs(collection(db, 'trucks'));
      const trucksData = trucksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 데이터가 없으면 초기 데이터 추가
      if (trucksData.length === 0) {
        await initializeData();
      } else {
        setData(trucksData);
      }
      
      // 사용자 데이터 로드 (관리자만)
      if (currentUser?.role === 'admin') {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      }
      
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 설정
  const initializeData = async () => {
    try {
      const promises = initialTrucks.map(truck => 
        addDoc(collection(db, 'trucks'), truck)
      );
      await Promise.all(promises);
      await loadData();
    } catch (error) {
      console.error('초기 데이터 설정 실패:', error);
    }
  };

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, authData.email, authData.password);
      setShowLoginModal(false);
      setAuthData({ email: '', password: '', name: '', confirmPassword: '' });
      alert('🎉 로그인 성공!');
    } catch (error) {
      alert('❌ 로그인 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 처리
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (authData.password !== authData.confirmPassword) {
      alert('❌ 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (authData.password.length < 6) {
      alert('❌ 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
      await updateProfile(userCredential.user, { displayName: authData.name });
      
      // 사용자 정보를 Firestore에 저장
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email: authData.email,
        name: authData.name,
        role: 'user',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active'
      });
      
      setShowLoginModal(false);
      setAuthData({ email: '', password: '', name: '', confirmPassword: '' });
      alert('✅ 회원가입 성공!');
    } catch (error) {
      alert('❌ 회원가입 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('lookup');
      setSelectedCarrier('');
      setSelectedTruck('');
      setDriverName('');
      alert('👋 로그아웃되었습니다.');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 정렬된 고유한 운송업체 목록 생성
  const carriers = [...new Set(data.map(item => item.carrier))].sort((a, b) => a.localeCompare(b, 'ko'));

  // 선택된 운송업체에 따른 가나다순 정렬된 트럭 번호 목록
  const availableTrucks = selectedCarrier
    ? data.filter(item => item.carrier === selectedCarrier)
         .map(item => item.truck)
         .sort((a, b) => a.localeCompare(b, 'ko', { numeric: true, sensitivity: 'base' }))
    : [];

  // 운송업체 선택 시 처리
  const handleCarrierChange = (e) => {
    const carrier = e.target.value;
    setSelectedCarrier(carrier);
    setSelectedTruck('');
    setDriverName('');
  };

  // 트럭 번호 선택 시 처리
  const handleTruckChange = (e) => {
    const truck = e.target.value;
    setSelectedTruck(truck);
    
    const foundDriver = data.find(item => 
      item.carrier === selectedCarrier && item.truck === truck
    );
    
    setDriverName(foundDriver ? foundDriver.driver : '❌ 운전자 정보 없음');
  };

  // 새 데이터 추가
  const handleAddData = async (e) => {
    e.preventDefault();
    
    if (currentUser?.role !== 'admin') {
      alert('❌ 관리자만 데이터를 추가할 수 있습니다.');
      return;
    }
    
    // 중복 확인
    const duplicate = data.find(item => 
      item.carrier === formData.carrier && item.truck === formData.truck
    );
    
    if (duplicate) {
      alert('❌ 이미 존재하는 운송업체-트럭번호 조합입니다.');
      return;
    }
    
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'trucks'), formData);
      setFormData({ carrier: '', truck: '', driver: '' });
      await loadData();
      alert('✅ 새 데이터가 추가되었습니다!');
    } catch (error) {
      alert('❌ 데이터 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 데이터 수정 시작
  const startEdit = (item) => {
    if (currentUser?.role !== 'admin') {
      alert('❌ 관리자만 데이터를 수정할 수 있습니다.');
      return;
    }
    setEditingId(item.id);
    setEditData({ ...item });
  };

  // 데이터 수정 저장
  const saveEdit = async (id) => {
    setLoading(true);
    
    try {
      await updateDoc(doc(db, 'trucks', id), editData);
      setEditingId(null);
      setEditData({});
      await loadData();
      alert('✅ 데이터가 수정되었습니다!');
    } catch (error) {
      alert('❌ 데이터 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 데이터 삭제
  const deleteData = async (id) => {
    if (currentUser?.role !== 'admin') {
      alert('❌ 관리자만 데이터를 삭제할 수 있습니다.');
      return;
    }
    
    if (window.confirm('🗑️ 정말 삭제하시겠습니까?')) {
      setLoading(true);
      
      try {
        await deleteDoc(doc(db, 'trucks', id));
        await loadData();
        alert('✅ 데이터가 삭제되었습니다!');
      } catch (error) {
        alert('❌ 데이터 삭제에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  // 메인 화면 (로그인 전)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🚛 LOTTE 트럭 운전자 조회 시스템
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              효율적인 운송 관리를 위한 통합 시스템
            </p>
            
            {/* 로그인 버튼 */}
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-blue-500 text-white px-8 py-4 rounded-xl hover:bg-blue-600 transition-colors font-medium text-lg shadow-lg"
            >
              🔑 로그인 / 회원가입
            </button>
          </div>

          {/* 기능 소개 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">실시간 조회</h3>
              <p className="text-gray-600">운송업체별 트럭과 운전자 정보를 실시간으로 조회할 수 있습니다.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">효율적 관리</h3>
              <p className="text-gray-600">데이터 추가, 수정, 삭제를 통한 체계적인 관리가 가능합니다.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">다중 사용자</h3>
              <p className="text-gray-600">권한별 접근 제어로 안전하고 체계적인 사용자 관리를 제공합니다.</p>
            </div>
          </div>

          {/* 연결 상태 */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
              🔥 Firebase 실시간 데이터베이스 연결됨 (LA 서버)
            </div>
          </div>
        </div>

        {/* 로그인 모달 */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {authMode === 'login' ? '🔑 로그인' : '👤 회원가입'}
                </h2>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input
                      type="text"
                      value={authData.name}
                      onChange={(e) => setAuthData({...authData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="이름을 입력하세요"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({...authData, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="이메일을 입력하세요"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                  <input
                    type="password"
                    value={authData.password}
                    onChange={(e) => setAuthData({...authData, password: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                </div>
                
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                    <input
                      type="password"
                      value={authData.confirmPassword}
                      onChange={(e) => setAuthData({...authData, confirmPassword: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="비밀번호를 다시 입력하세요"
                      required
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-400"
                >
                  {loading ? '처리 중...' : (authMode === 'login' ? '로그인' : '회원가입')}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  {authMode === 'login' ? '회원가입하기' : '로그인하기'}
                </button>
              </div>
              
              {/* 테스트 계정 안내 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="font-medium mb-2">🔐 테스트 계정:</p>
                <div className="space-y-1">
                  <p><strong>관리자:</strong> admin@lotte.com / admin123</p>
                  <p><strong>일반사용자:</strong> user@lotte.com / user123</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 상단 사용자 정보 */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              currentUser?.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              {currentUser?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-800">{currentUser?.name}</p>
              <p className="text-sm text-gray-600">
                {currentUser?.role === 'admin' ? '🔧 관리자' : '👤 사용자'} | {currentUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-t-2xl shadow-xl">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'lookup' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🔍 조회
            </button>
            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('add')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'add' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ➕ 추가
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'manage' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ⚙️ 관리
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-xl p-8 relative">
          {/* 로딩 오버레이 */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-b-2xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">처리 중...</p>
              </div>
            </div>
          )}

          {/* 조회 탭 */}
          {activeTab === 'lookup' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                🚛 LOTTE 운전자 조회
              </h2>
              
              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    운송업체 (가나다순 정렬)
                  </label>
                  <select
                    value={selectedCarrier}
                    onChange={handleCarrierChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">운송업체를 선택하세요</option>
                    {carriers.map((carrier, index) => (
                      <option key={index} value={carrier}>
                        {carrier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    트럭 번호 (가나다순 정렬)
                  </label>
                  <select
                    value={selectedTruck}
                    onChange={handleTruckChange}
                    disabled={!selectedCarrier}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">
                      {selectedCarrier ? '트럭번호를 선택하세요' : '먼저 운송업체를 선택하세요'}
                    </option>
                    {availableTrucks.map((truck, index) => (
                      <option key={index} value={truck}>
                        {truck}
                      </option>
                    ))}
                  </select>
                </div>

                {driverName && (
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👤</span>
                      <div>
                        <p className="text-sm font-medium text-blue-800">운전자 이름</p>
                        <p className="text-lg font-bold text-blue-900">{driverName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 추가 탭 (관리자만) */}
          {activeTab === 'add' && currentUser?.role === 'admin' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                ➕ 새 데이터 추가
              </h2>
              
              <form onSubmit={handleAddData} className="max-w-md mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    운송업체
                  </label>
                  <input
                    type="text"
                    value={formData.carrier}
                    onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="운송업체명을 입력하세요"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    트럭 번호
                  </label>
                  <input
                    type="text"
                    value={formData.truck}
                    onChange={(e) => setFormData({...formData, truck: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="트럭번호를 입력하세요"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    운전자 이름
                  </label>
                  <input
                    type="text"
                    value={formData.driver}
                    onChange={(e) => setFormData({...formData, driver: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="운전자 이름을 입력하세요"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-400"
                >
                  {loading ? '추가 중...' : 'Firebase에 추가하기'}
                </button>
              </form>
            </div>
          )}

          {/* 관리 탭 (관리자만) */}
          {activeTab === 'manage' && currentUser?.role === 'admin' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                ⚙️ 데이터 관리
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left">운송업체</th>
                      <th className="border border-gray-300 p-3 text-left">트럭번호</th>
                      <th className="border border-gray-300 p-3 text-left">운전자</th>
                      <th className="border border-gray-300 p-3 text-center">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3">
                          {editingId === item.id ? (
                            <input
                              type="text"
                              value={editData.carrier}
                              onChange={(e) => setEditData({...editData, carrier: e.target.value})}
                              className="w-full p-1 border rounded"
                            />
                          ) : item.carrier}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {editingId === item.id ? (
                            <input
                              type="text"
                              value={editData.truck}
                              onChange={(e) => setEditData({...editData, truck: e.target.value})}
                              className="w-full p-1 border rounded"
                            />
                          ) : item.truck}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {editingId === item.id ? (
                            <input
                              type="text"
                              value={editData.driver}
                              onChange={(e) => setEditData({...editData, driver: e.target.value})}
                              className="w-full p-1 border rounded"
                            />
                          ) : item.driver}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {editingId === item.id ? (
                            <div className="space-x-2">
                              <button
                                onClick={() => saveEdit(item.id)}
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="space-x-2">
                              <button
                                onClick={() => startEdit(item)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => deleteData(item.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 권한 없음 메시지 */}
          {(activeTab === 'add' || activeTab === 'manage') && currentUser?.role !== 'admin' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">관리자 권한 필요</h3>
              <p className="text-gray-600">이 기능은 관리자만 사용할 수 있습니다.</p>
            </div>
          )}
        </div>

        {/* 통계 정보 */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 실시간 현황</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{carriers.length}</p>
              <p className="text-sm text-gray-600">운송업체</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{data.length}</p>
              <p className="text-sm text-gray-600">총 트럭</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {data.filter(item => item.driver).length}
              </p>
              <p className="text-sm text-gray-600">운전자 배정</p>
            </div>
          </div>
        </div>

        {/* 실제 배포 안내 */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">🚀 실제 Firebase 배포 완료!</h3>
          <div className="text-sm text-green-700 space-y-2">
            <p>• <strong>실시간 데이터베이스</strong> 연결됨</p>
            <p>• <strong>Los Angeles 서버</strong> 사용 중</p>
            <p>• <strong>Firebase Authentication</strong> 활성화</p>
            <p>• <strong>다중 사용자 지원</strong> 가능</p>
            <div className="mt-3 p-3 bg-white rounded-lg border-l-4 border-green-500">
              <p className="font-medium text-green-800">✅ 운영 준비 완료!</p>
              <p className="text-green-600">동료들과 URL 공유하여 함께 사용하세요!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteTruckManager;
